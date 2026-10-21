# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session start — do this first, every new session, before any work
1. **Read these, and nothing else from `docs/` unless needed:** this file, `docs/BUILD-REFERENCE.md` (how the app is currently built), and **only the `[OPEN]` version** in `docs/VERSION-HISTORY.md` (skip `[CLOSED]` versions entirely).
2. **Schema check** (read-only, cheap — metadata only, never row data). Write the generated types to the scratchpad, not the repo:
   - `npx supabase migration list` — every local migration must have a matching remote one.
   - `npx supabase gen types typescript --linked > <scratchpad>/live-types.ts`, then diff against `src/lib/supabase/database.types.ts` (ignore the `PostgrestVersion` line — it changes with Supabase's tooling, not the schema).
   - If either shows drift, tell the developer before building anything.
3. **Summarize your understanding** to the developer — current structure, which version is open, what's done and what's next — and **wait for their confirmation** before starting work.

**After every implementation or code write:** update the open version in `docs/VERSION-HISTORY.md` (tick finished tasks, add a dated Work log line: what changed, what's verified, what's in progress). If the change alters how the app is structured (table, env var, service, architecture), update `docs/BUILD-REFERENCE.md` too.

## Project
UMD Bill Estimator — a web app that estimates a University of Maryland student's total cost (tuition, fees, housing, dining, parking) by combining official UMD rate data with a student's own selections. This is a personal portfolio/resume project, not an official UMD product — the UI must always make clear it's unofficial and unaffiliated.

## Stack
- Next.js (App Router), TypeScript, Tailwind
- Supabase (Postgres + Auth) — main database and user accounts
- AWS: S3 (hall photos), Lambda (scheduled scraper), EventBridge Scheduler (triggers Lambda), IAM (least-privilege roles between them)
- AI: Claude or Gemini API via function calling, for natural-language input parsing

## Commands
Node 24 (`.nvmrc`). CI (`.github/workflows/ci.yml`) runs `npm ci`, lint, test, build.
- `npm run dev` / `npm run build` / `npm run lint`
- `npm test` (Vitest, run once) · `npm run test:watch` · single file: `npx vitest run src/lib/calculator/calculateTotal.test.ts` · single test: add `-t "name"`. Vitest and ESLint don't exclude `.claude/worktrees/`, so any worktree checkouts inflate test counts and lint output — remove them before trusting the numbers.
- Scraper scripts load `.env.local` via `tsx --env-file`: `npm run scrape` (fills `_staging` tables), `npm run promote` (staging → live; manual, deliberately never automated), `npm run academic-year:create` / `academic-year:activate`
- `npm run build:lambda` — compiles the scraper for AWS Lambda into `dist/lambda` (`tsconfig.lambda.json`, `scraper/lambda-package.json`)
- DB changes are timestamped SQL files in `supabase/migrations/`; `src/lib/supabase/database.types.ts` holds the generated types.

**Next.js here is v16 and differs from older versions** (see `AGENTS.md`): read the relevant guide in `node_modules/next/dist/docs/` before writing Next-specific code. Example: request interception lives in `src/proxy.ts`, not `middleware.ts`.

## Architecture map
- `src/lib/calculator/` — the pure engine: `calculateTotal`, `validateSelections`, and `verifyAiPatch` (validates AI output against live rate data). Tests sit beside the source.
- `src/lib/ai/` — chat feature behind the `AiProvider` interface (`providers/`, currently Gemini; chosen via `getProvider.ts`). `tools/` holds the function-calling tools (`setSelections`, `evaluateBudget`, `getHousingPhotos`). `verifyReplyText.ts` checks dollar figures in model replies against tool results. `rateLimit.ts` and `logging.ts` use the `ai_rate_limits` / `ai_parse_logs` tables. The only HTTP entry point is `src/app/api/chat/route.ts`.
- `src/lib/content/` — static descriptions (`housingDescriptions.ts`, `parkingDescriptions.ts`, `mealsDescriptions.ts`) and `housingImages.ts` (lists housing photos from S3).
- `src/lib/supabase/` — `getRatesBundle.ts` loads all rate tables (incl. the winter section) for the current academic year (`getRatesBundleForYear` for a specific one) into the shape the calculator takes. `scenarioMapping.ts` turns selections into the stored rate-row ids and back, per semester (what a scenario stores differs for winter). `scenarios.ts` resolves saved scenarios: editing is locked server-side for any non-current academic year; viewing/printing is never locked. Scenario writes go through the service-role client, which bypasses RLS, so every query must filter on the verified session's `user_id` explicitly.
- `src/app/` — Server Components read Supabase directly. Mutations are Server Actions (`dashboard/actions.ts`, `settings/actions.ts`). `dashboard/results` renders the printable bill using the same breakdown functions as the dashboard.
- `src/components/dashboard/` — client-side selection state (`selections.ts`), `panels/` for each step, `results/` for the bill view. Dashboard selections persist in `sessionStorage`.
- `scraper/` — one `fetch*Page.ts` per UMD source, then `writeToStaging.ts`, then `promoteStaging.ts`. `lambdaHandler.ts` is the scheduled entry point (EventBridge, monthly). New-year rollover: `academic-year:create` → `scrape` → review → `promote` → `academic-year:activate`.
- AI chat limits: grants are deliberately not settable by the AI, and at most one tool call is handled per model turn. The assistant never switches a student's semester kind over an existing plan (`tools/patchGuards.ts`); cost tools (`evaluateBudget`, `findMaxCredits`) are the only source of dollar figures in replies.

## Critical rules — do not violate these

1. **The AI never computes dollar amounts.** It only parses natural language into structured selections (which tuition rate, housing type, dining plan, etc.). `calculateTotal()` is the only function allowed to produce a price, anywhere in the codebase.
2. **Calculation functions are pure.** No side effects, no database calls inside them, no mutating a running total. Same inputs must always produce the same output. This is what makes them unit-testable.
3. **Recompute, don't accumulate.** The live total shown in the UI is recalculated from the full current selection state on every change — never incrementally added to or subtracted from as the user picks things.
4. **Calculation and validation are separate concerns.** `calculateTotal` never checks whether a selection is required or missing — it prices whatever is selected and treats a missing/null selection as $0 for that line. `validateSelections` is the only place "is this required" logic belongs, and it distinguishes always-required fields (tuition, credit hours) from conditionally-required ones (dining plan, only required for certain housing types).
5. **Don't add a database column or table for a dimension that doesn't actually vary.** If a value is identical across some category (e.g. a fee that doesn't differ by residency), it doesn't get its own column/table for that category — see `docs/PLAN.md` for the reasoning trail on several of these calls.
6. **Scraped rate data always goes through a staging/review step.** Never write scraped values directly into the live tables the app reads from.

## Database schema (Supabase/Postgres)

**Column-level detail lives in `src/lib/supabase/database.types.ts` and `supabase/migrations/` — read those, don't rely on a copy here (verified against the live project at session start).** What the files don't make obvious:

- Every rate table (`tuition_rates`, `mandatory_fees`, `differential_tuition`, `housing_rates`, `resident_dining_plans`, `block_dining_plans`, `parking_permits`, `graduate_tuition_rates`, `graduate_fees`, `health_insurance_rates`) has an `academic_year_id` FK to `academic_years`, which is how a new year's rates become a data insert instead of a code change.
- `academic_years` also holds `is_current` (only one row can be), the credit-hour thresholds for full-time fees/tuition (these live in the DB, not in code), and `winter_max_credit_hours` (hand-set, nullable, never scraped/staged — null means no winter that year).
- Winter Session rates live in `winter_tuition_rates`, `winter_graduate_tuition_rates` (one row per residency × credit count = published total price, never multiplied) and `winter_fees`, each with a `_staging` twin.
- Each of those rate tables has a `_staging` twin; scrapes only write there. `scenarios` stores a user's saved plan; `ai_parse_logs` / `ai_rate_limits` back the AI chat.
- `housing_rates.rate` is the full academic-year total, not per semester. Graduate tuition has no flat full-time rate. Health insurance rates are shared by undergrad and grad; only the eligibility threshold differs (below).
- `scenarios` stores exactly one of `tuition_rate_id` / `graduate_tuition_rate_id`, and its writes go through the service-role client (see Architecture map).

**Known business rules to encode in `validateSelections` / the calculation engine:**
- A dining plan is required unless the selected housing has a kitchen (Apartment category only).
- A scenario should never have both `resident_dining_plan_id` and `block_dining_plan_id` set — not enforced by the database, must be enforced in application code.
- Health insurance eligibility differs by student level: undergrad triggers at 6+ credits, grad triggers at 48+ units/semester (or 36 in a 12-week term) — a different threshold and a different unit system, not just a different number.

## Code organization conventions

- Before creating a new folder anywhere in the codebase, check whether a folder with that name (or a near-duplicate purpose) already exists elsewhere in the tree — don't create a second `panels/`, `actions.ts`, etc. in a different location when an existing one already serves that role, and don't give two different folders overlapping names/purposes. Keep new files/folders organized consistently with the existing structure rather than bolting on a parallel convention.

- Build features so they can scale — the developer wants to be able to build on top of them (new seasons, new categories, new rate tables) without reworking them. Prefer data-driven structures and exhaustive lookups (`Record<Semester, …>`, per-semester config, rows in a table) over scattered `if (x === "fall")` branches, and put an extension point wherever a second case is plausible. Don't build unused abstractions for cases that aren't plausible; the goal is that the next case is an addition, not a refactor.

- Every UI feature must be designed for mobile as well as desktop — when adding or changing something for one, make sure it fits the other (check at a ~375px viewport) rather than treating mobile as an afterthought. Use responsive CSS breakpoints, not device detection.

## Working style with the developer

This project is meant to reflect genuine engineering care — the goal is code the developer deeply understands and can explain, not just code that works. Calibrate what to build autonomously vs. what to work through together:

**Fine to build directly:**
- Scaffolding, boilerplate, config files (Next.js setup, ESLint/Prettier, Tailwind config, CI/CD)
- Repetitive code (similar API routes/components, types generated from the schema)
- Non-critical UI components and styling
- Data-seeding scripts once real scraped values have been provided
- Explaining error messages — explain the cause, don't just silently patch it

**Don't just write these for him — work through them together, or have him attempt it first:**
- The calculation engine logic — this is the core "engineering" of the project he needs to be able to explain
- Schema/data model decisions — be a sounding board, but he makes the call
- Debugging logic bugs (not syntax errors) — help him trace through it rather than jumping straight to the fix

**Always do, regardless of what gets built:** after generating anything non-trivial, walk him through what it does before he commits it — don't just hand over a diff and move on.

**Never do on his behalf:** git commands (add/commit/branch/merge) — he should type these himself, even if you suggest what to run.

Rule of thumb: if it's real engineering reasoning behind a decision (not just boilerplate), make sure he understands it deeply, even if you write the first draft. If it's plumbing that just needs to exist and work, build it.

## Where to find more context

**Read every session (see "Session start" above):**
- `docs/BUILD-REFERENCE.md` — how the app is currently built and configured (stack, schema notes, env vars, S3/Lambda/AI setup). Structure only, no history.
- `docs/VERSION-HISTORY.md` — read **only the `[OPEN]` version**: its goal, plan, tasks, and work log. Skip `[CLOSED]` versions.

**Reference only as needed:**
- `docs/umd-bill-estimator-housing-dining-rules.md` — housing/dining eligibility rules in detail
- `docs/umd-bill-estimator-parking-rules.md` — parking permit types and rules in detail
- `docs/umd-bill-estimator-data-sources.md` — every scrape source URL, organized by category

**Archived, do not read unless explicitly asked:**
- `docs/PROGRESS-LOG.md` — closed v1 session-by-session history. Never append to it.
- `docs/umd-bill-estimator-getting-started-checklist.md` — the original pre-project research/setup checklist, with the Decisions & Ideas Log containing early reasoning. Marked archived at the top of the file itself too.
- `docs/PLAN.md` / `docs/DECISIONS.md` — referenced by older material but never created as literal files; that content lives inside the archived checklist. Not a gap to fix unless asked.

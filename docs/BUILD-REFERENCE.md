# UMD Bill Estimator — Build Reference

Clean, condensed version of everything locked in. For the full reasoning/history behind any decision, see the other docs in this folder — this one is just the "what to build" summary.

---

## Stack
- Next.js (App Router) + TypeScript + Tailwind
- Supabase — database + auth
- AWS — S3 (hall photos), Lambda (scraper), EventBridge Scheduler (trigger), IAM (least-privilege roles)
- AI — Claude or Gemini API, function calling, natural-language input parsing only for v1
- GitHub (public repo, MIT license, branch-protected) + Vercel (hosting)

---

## Database schema — 11 reference tables + scenarios

| Table | Key fields |
|---|---|
| `academic_years` | label |
| `tuition_rates` | residency, full_time_rate, per_credit_rate |
| `mandatory_fees` | part_time_rate (1-8 credits), full_time_rate (9+) |
| `differential_tuition` | full_time_rate, per_credit_rate |
| `housing_rates` | room_type, building_category, rate (annual total) |
| `resident_dining_plans` | plan_name, dining_dollars, guest_passes, fall_price, spring_price |
| `block_dining_plans` | plan_label, meal_count, dining_dollars, price |
| `parking_permits` | permit_type, term, price |
| `graduate_tuition_rates` | residency, per_credit_rate |
| `graduate_fees` | part_time_rate, full_time_rate |
| `health_insurance_rates` | fall_price, spring_price |
| `scenarios` | user_id, name, academic_year_id, major, credit_hours, applies_differential_tuition, tuition_rate_id, housing_rate_id (nullable), resident_dining_plan_id (nullable), block_dining_plan_id (nullable), parking_permit_id (nullable), computed_total, created_at, updated_at |

Every reference table hangs off `academic_years` via foreign key. Deferred, not forgotten: fraternity housing, parking bundle packs/carpool discount, orientation fee.

---

## Calculation engine
- Pure functions, one per category (tuition, fees, insurance, housing, dining, parking), composed by `calculateTotal()`
- `calculateTotal` — pricing only, no validation. Missing/null selection = $0 for that line, no error.
- `validateSelections` — separate function. Handles two kinds of required: always-required (tuition, credit hours) and conditionally-required (dining plan, only if housing type requires it)
- **Recompute from scratch on every selection change** — no incremental add/subtract accumulator
- AI never computes dollar amounts — it only parses input into structured selections; `calculateTotal` is the sole source of truth for numbers

---

## API routes
- Reading rate data → Server Components, direct Supabase query, no API route needed
- Save/generate scenario → Server Action
- AI natural-language input → Route Handler (needs server-side API key; potential streaming)

---

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-safe
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never exposed to the client
- `GEMINI_API_KEY` — the AI chat feature's provider key, server-only, read only inside `src/lib/ai/providers/gemini.ts`. `ANTHROPIC_API_KEY` stays reserved, unused, for a future Claude-provider swap (see the AI chat section below) — the provider seam (`src/lib/ai/providers/types.ts`) is designed so adding it later doesn't touch anything else in this feature.
- `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION` — only needed for local scraper testing; the deployed Lambda uses its IAM role instead
- `AWS_PHOTOS_ACCESS_KEY_ID`/`AWS_PHOTOS_SECRET_ACCESS_KEY`/`AWS_PHOTOS_REGION`/`AWS_PHOTOS_BUCKET` — separate credential for the app's own read-only S3 access (housing photos). Deliberately distinct from the scraper's `AWS_*` vars above — different IAM user (`app-photo-reader`: `s3:ListBucket` + `s3:GetObject` only, no write), different purpose, never meant to collide.
- `SUPABASE_SECRET_ARN`, `NEXT_PUBLIC_SUPABASE_URL` — set directly in the Lambda's own console configuration (Configuration → Environment variables), not `.env.local`. Neither is sensitive (an ARN is just an identifier; the Supabase URL is public-safe already), so both are plain Lambda env vars rather than Secrets Manager entries. `SUPABASE_SERVICE_ROLE_KEY` is deliberately **not** a Lambda env var at all — see the section below.

---

## S3 bucket structure — housing photos

Bucket: `umd-bill-estimator-photos` (region `us-east-2`), public-read on objects only (bucket policy grants anonymous `s3:GetObject`, nothing else — no public listing, no public write). Two IAM users touch this bucket, each scoped to exactly one job:
- `s3-photo-uploader` — `s3:PutObject` + `s3:GetObject` only, used locally (`aws s3 cp`) to actually upload/replace photos. No delete permission on purpose (confirmed for real: an attempted `aws s3 rm` with this credential fails with AccessDenied, exactly as intended).
- `app-photo-reader` — `s3:ListBucket` + `s3:GetObject` only, used server-side by the app itself to discover what's in each folder. No write/delete permission at all.

S3 has no real folders — a "folder" is just everything sharing a key prefix, and the **filename after that prefix is always free-form (any name, any extension)** — only the prefix itself has to match exactly. Layout:

```
housing/room-types/<slug>/<any filename>
housing/building-categories/<slug>/<any filename>
```

**Room type slugs** (8, matches every real `housing_rates.room_type` value):

| DB value | Folder slug |
|---|---|
| Single | `single` |
| Single With Bath | `single-with-bath` |
| Double | `double` |
| Double With Bath | `double-with-bath` |
| Converted Single | `converted-single` |
| Double Requires Bunked Beds | `double-requires-bunked-beds` |
| Triple or Quad | `triple-or-quad` |
| Triple or Quad With Bath | `triple-or-quad-with-bath` |

**Building category slugs** (5 folders covering all 6 DB values — Traditional With/Without AC deliberately share one folder, no visual difference between them):

| DB value | Folder slug |
|---|---|
| Traditional Without AC | `traditional` |
| Traditional With AC | `traditional` |
| New Traditional | `new-traditional` |
| Semi-Suite | `semi-suite` |
| Suite | `suite` |
| Apartment | `apartment` |

To add or replace a photo: `aws s3 cp your-photo.jpg s3://umd-bill-estimator-photos/housing/room-types/<slug>/your-photo.jpg` (or the `building-categories` path) using the `s3-photo-uploader` credential. No code changes needed either way — the app discovers whatever's actually in each folder at request time (cached ~24h, same as rate data).

---

## AWS Lambda scraper automation

Automates the scrape-into-staging half of the pipeline below on a monthly schedule. Promotion stays a deliberate manual step (`npm run promote`), by design — never automated.

**Secrets Manager**: one secret, `umd-bill-estimator/supabase-service-role-key` (ARN: `arn:aws:secretsmanager:us-east-2:391894612707:secret:umd-bill-estimator/supabase-service-role-key-ZL62sv`), holding `{ SUPABASE_SERVICE_ROLE_KEY: "<value>" }` as its key/value JSON. No rotation configured (not applicable — this isn't a key AWS can regenerate on its own). Chosen over a plain Lambda environment variable specifically because Secrets Manager access requires its own independently-grantable IAM permission (`secretsmanager:GetSecretValue`), whereas a Lambda's plain env vars are visible in plaintext to anyone who can view that function's configuration.

**Three separate IAM roles/permissions, least-privilege, each scoped to exactly one job** — the same discipline as the S3 IAM users above, applied across three different *kinds* of AWS-run identity:
- `umd-bill-estimator-scraper-lambda-role` — the Lambda's own execution role. Trust policy: only the Lambda service can assume it. Permissions: `AWSLambdaBasicExecutionRole` (AWS-managed, CloudWatch logging baseline) + one inline policy (`read-supabase-secret`) granting `secretsmanager:GetSecretValue` scoped to the one secret ARN above, nothing broader.
- The EventBridge Scheduler's own auto-generated role (created via the scheduler's "Create new role for this schedule" option) — trust policy: only the Scheduler service can assume it. Permission: `lambda:InvokeFunction` scoped to this one function's ARN, nothing else.
- No VPC — Lambda's default networking already reaches the public internet (UMD's pages), and a VPC here would only mean paying for a NAT gateway for no benefit.

**Lambda function**: `umd-bill-estimator-scraper`, Node.js 20.x, handler `scraper/lambdaHandler.handler`, timeout bumped to 2 min (default 3 sec is nowhere near enough for six sequential page scrapes — real runs finish in ~9.5s, so there's plenty of headroom), memory 256 MB. Deployed by zipping `dist/lambda` (`npm run build:lambda`, then `Compress-Archive -Path dist\lambda\* -DestinationPath dist\lambda.zip` on Windows) and uploading via the console's "Upload from → .zip file."

**`scraper/lambdaHandler.ts`'s secret-fetch mechanism** — the one piece of code specific to running in Lambda, not shared with the CLI scripts: `handler()` calls Secrets Manager (`GetSecretValueCommand`, authenticated implicitly via the execution role, no credentials in code) and sets `process.env.SUPABASE_SERVICE_ROLE_KEY` from the result, then `await import()`s `supabaseClient.ts`/`runScrape.ts` — a **dynamic** import specifically so that module evaluation (and `supabaseClient.ts`'s existing top-of-file `process.env` read, left completely unchanged) happens *after* the secret lands in the environment, not before. `supabaseClient.ts` itself and all four CLI scripts (`scrape`/`promote`/`academic-year:create`/`academic-year:activate`) needed zero changes — `lambdaHandler.ts` is the only thing `tsconfig.lambda.json` ever bundles, so it's the only code that ever runs inside Lambda at all.

**EventBridge Scheduler**: `umd-bill-estimator-monthly-scrape`, cron `cron(0 6 1 * ? *)` (06:00 UTC on the 1st of every month), targeting the Lambda directly, flexible time window off (irrelevant with a single target).

**Verified for real, 2026-09-15**: manual console "Test" invoke succeeded end to end — all six scrape groups staged with no errors, `Billed Duration: 9445 ms`, `Max Memory Used: 149 MB` (comfortable under the 2 min / 256 MB budgets). Confirms the full chain: the execution role's implicit auth to Secrets Manager, the fetched key's validity against the real staging tables, and the dynamic-import ordering trick all worked correctly on a real run, not just in theory.

---

## AI natural-language input feature (step 11)

Chat interface (`ChatPanelContent.tsx` + desktop/mobile wrappers) that parses free text into a `Selections` patch via LLM function-calling. Provider: Gemini (`gemini-3.5-flash-lite`), chosen for cost after a real pricing comparison against Claude -- see `PROGRESS-LOG.md` (2026-09-15) for the numbers. Architecture is deliberately provider-swappable (see below) in case Gemini's quality ever proves insufficient.

**The core safety mechanism**: `src/lib/calculator/verifyAiPatch.ts` builds the tool's JSON schema dynamically from the live `RatesBundle` (never hardcoded enums) and re-validates every field the model returns against that same real data before it's ever applied -- including composite pairs like `{roomType, buildingCategory}`, since a value can be individually well-typed but still not correspond to any real rate row (the exact class of bug documented in the 2026-09-04 log entry). The AI's patch type is a hand-picked allowlist of `Selections` fields, not `Partial<Selections>` -- **`grants` is deliberately excluded** (2026-09-15 decision): the one field group with no rate-table lookup behind it. The system prompt instructs the AI to redirect grant mentions to the Aid & Grants tab instead.

**Provider abstraction** (`src/lib/ai/providers/types.ts`): every tool and the Route Handler depend only on the generic `AiProvider` interface, never a provider SDK directly. `src/lib/ai/providers/gemini.ts` is the only file that imports `@google/genai`. Swapping to a Claude model later means adding one new file here and changing `getProvider.ts`'s return statement -- nothing else in the feature changes.

**Tools** (`src/lib/ai/tools/`): `setSelections` (the core patch tool), `getHousingPhotos` (reuses the existing S3 `getHousingImages()` pipeline), and `evaluateBudget` (2026-09-16 -- see below). **v1 handles at most one tool call per model turn by design** -- multiple simultaneous tool calls in one turn are deferred, not silently mishandled. Confirmed live, twice, as a real (safe, never-wrong) limitation: a message combining two intents in one breath (e.g. "set my details AND check my budget," or "show me a photo AND check my budget") only gets ONE of the two fulfilled that turn; the model correctly asks/answers the rest on a follow-up rather than guessing. Not yet fixed -- would mean extending `AiProvider.continueWithToolResult` to accept multiple tool-call/result pairs in one round trip; flagged to the user, not yet approved as a change.

**`evaluateBudget` (2026-09-16)**: answers "can I afford X," "what if I add Y," "compare scenario A vs B" -- WITHOUT the AI ever computing a number itself. Takes 1-3 labeled hypothetical `changes` patches (same schema `setSelections` uses, reused directly) plus an optional `targetBudget`; merges each onto the student's real current selections (now sent from the client every request -- see `AiToolContext.currentSelections`), runs the real `validateSelections`/`calculateTotal`/`calculateNetTotal`, and returns real gross AND net-of-aid totals plus a real budget comparison for each. Never mutates real state on its own -- the returned card's "Apply this scenario" button is the only thing that calls `onSelectionsChange`, same click-to-commit model as everywhere else. A second backend safety net (`src/lib/ai/verifyReplyText.ts`) double-checks every reply: any dollar figure that doesn't match a real number `evaluateBudget` just computed (or one the student themselves typed) gets the whole reply swapped for a safe, deterministic templated sentence built from the real result -- and any raw link/markdown image syntax is stripped from every reply unconditionally (this is also what fixed a real bug where the model was pasting the photo's raw S3 URL into its own text).

**Per-request context** (`src/lib/ai/describeSelections.ts`, 2026-09-16): a compact summary of the student's already-known selections is appended to the system prompt on every request -- conversation history alone isn't reliable context (a student may have set fields by clicking dashboard panels directly, with nothing about it in the current chat's history), and without this the model would ask for or contradict already-known information even though the tools themselves had full context all along. Found via live testing, not anticipated in the design.

**Rate limiting**: a Postgres counter table (`ai_rate_limits`) + one atomic RPC function (`check_and_consume_ai_rate_limit`, avoids a check-then-write race between concurrent requests), not Redis/Upstash -- chosen deliberately for this project's scale. Guests identified by a signed httpOnly cookie (not IP alone), signed-in users by their real `user_id`. Caps: guests 5/min, 20/day; signed-in 10/min, 60/day (starting numbers, tunable). Checked *before* the paid Gemini call -- that ordering is the actual cost protection.

**Logging**: `ai_parse_logs` table, service-role-only (no RLS policies at all), meant to be short-retention (14-30 days -- a pruning job isn't built yet, tracked as a follow-up). Disclosed in `/privacy`, updated the same session this feature shipped. Already proved its own value twice during this build -- both the retired-model 404 and a validation-rejection case were root-caused by reading this table directly, not by guessing.

**UI**: `ChatConfirmationChips` (setSelections), `ChatPhotoPreview` (getHousingPhotos -- a real inline thumbnail with a "+N more" badge, opening the existing `ImageLightbox` via its new optional `trigger` prop; replaced a bare "Expand" button that had no visible photo at all), `ChatBudgetComparison` (evaluateBudget -- before/after-aid hierarchy, a dollar-gap budget badge, container-query responsive grid since this renders in a fixed-width panel, not the viewport). The photo and budget-card components (2026-09-16) were built by two parallel sub-agents in isolated worktrees against a frozen type contract, reviewed and merged in by hand -- not auto-merged.

**Verified live against the real Gemini API and a real browser session, 2026-09-15/16** (not just unit tests): correct parsing of a real multi-field sentence, off-topic refusal, the grants redirect, the housing-photos tool, the rate limiter actually tripping at the guest cap, a real invalid housing combination (`Converted Single` + `Apartment`, which doesn't exist as a real rate row) being caught by `verifyAiPatch` and the model reacting with a sensible clarifying question instead of crashing, gross/net-of-aid budget comparisons, and the photo-in-text bug being fixed. Two real mid-build findings, both caught live and fixed on the spot: `gemini-2.5-flash-lite` (the model the original cost research was based on) was retired for new API keys during this build -- caught via a live 404 surfaced in `ai_parse_logs`, swapped to `gemini-3.5-flash-lite` (pricier than the original estimate, still cheaper than Claude's cheapest tier for this workload); and a false-positive in the dollar-amount safety net (it initially rejected the model correctly restating the student's own stated budget figure) -- fixed by extending the verified set to include amounts the student themselves typed, the same "transcribing, not computing" category grants already fall into.

---

## Running the scraper pipeline

Manual, by hand, until step 12's AWS automation lands (and even then, only the scrape-into-staging half will ever be automated — promotion stays a deliberate human decision by design):

```
npm run scrape -- <academic_year_id>
npm run promote -- <academic_year_id>
```

- `scrape` fetches the live UMD pages and writes into the 11 `_staging` tables — never the live tables directly.
- `promote` copies reviewed staging data into the live tables. Review the staged values before running this.
- Both are idempotent (clear-before-write) — safe to re-run either one.
- `<academic_year_id>` is the UUID from the `academic_years` table (e.g. `9aedff47-7e30-477b-ab85-9ca9cae145f0` for 2026-2027).

---

## Testing
- Vitest for unit tests, focused almost entirely on `calculateTotal`/`validateSelections` and their sub-functions — pure functions, cheap and high-value to test
- Skip E2E/UI testing (Playwright, etc.) for v1 — low payoff at this stage, revisit later if desired

---

## Build order

**This table is the canonical "where am I" status — kept current across sessions/machines. Updated whenever a decision is made about what to work on, in what order, or when a step's status changes.** Full session-by-session detail lives in `docs/PROGRESS-LOG.md`; this table is the condensed current-state view.

| # | Step | Status | Notes |
|---|---|---|---|
| 1 | Repo setup — public GitHub repo, MIT license, branch protection, `docs/` folder | Done | |
| 2 | Supabase fundamentals learning session (prerequisite) | Done | |
| 3 | Scaffold Next.js + TypeScript + Tailwind | Done | 2026-08-23 |
| 4 | Create Supabase project, build out the full schema | Done | 2026-08-24 — 11 tables + `scenarios`, RLS on everything |
| 5 | Set environment variables | Done | |
| 6 | Build the calculation engine (pure functions) + unit tests | Done | 2026-08-26; reworked semester-scoped 2026-08-29 |
| 7 | Build `validateSelections` | Done | 2026-08-29 |
| 8 | Build the selection UI with live-updating total (recompute pattern) | **Done** | Dashboard skeleton + state-lifting fix 2026-09-02. Cached `RatesBundle` fetch 2026-09-03 (`server.ts`, `getRatesBundle.ts`, `unstable_cache`, `academic_years.is_current`). `calculateTotal`/`validateSelections` fully wired 2026-09-04 — real Supabase data drives every category + the total + validation on every render; panel option lists derive from real DB values (was a real bug — old placeholders didn't match real casing and would have made `calculateTotal` throw); invalid combinations hide the total and disable "Generate Plan"; nothing pre-selected by default (`educationLevel`/`residency`/`livingSituation`/`creditHours` made nullable so a fresh visitor sees a genuine $0, not a bill computed against invisible defaults). **Merged to `main` via PR #14 (2026-09-04)** — CI build failure fixed along the way (`/dashboard` needed `export const dynamic = "force-dynamic"`, since static pre-rendering tried to run a real Supabase call at build time). |
| 9 | Build the Generate/save flow (Server Action → `scenarios` table) | **Done** | Schema audited against the live `Selections` type first, found real gaps: no `semester` column, `tuition_rate_id` only ever referenced the undergrad table (grad scenarios unrepresentable), no column at all for health insurance. Migration added `semester`, nullable `graduate_tuition_rate_id` (+ made `tuition_rate_id` nullable, exactly one set — enforced in code), `insurance_selected`. Also caught by the type system: an existing `living_situation` column (added 2026-08-29) the first draft missed entirely. `saveScenario()` (`src/app/dashboard/actions.ts`) re-checks auth, re-runs `validateSelections`, re-fetches rates and re-runs `calculateTotal` server-side, resolves every composite selection into its real row id, inserts via the service-role client. **2026-09-08: extended with an optional 100-char note** (new `note` column + `check` constraint, validated both client- and server-side) and **loading a saved scenario back into the dashboard** — `?scenario=<id>` on `/dashboard` resolves through `resolveScenarioToSelections()`, which reverses the id-resolution above and only ever returns a scenario actually owned by the requesting user (session-bound query + explicit `user_id` filter, fails closed to the empty defaults otherwise — see the security review notes below). Save is now its own explicit button, separate from a since-removed "Generate Plan" (deferred until the results/PDF page exists). `tsc`/lint/60 tests/production build all clean. **2026-09-09: real signed-in save/note/scenario-load confirmed working** by the user on a different machine, with an actual Google session (not simulated) — see PROGRESS-LOG for the entry. |
| 9a | Google OAuth wiring (Google Cloud Console client + Supabase provider config + real sign-in call in `AuthShell.tsx` + auth callback route) | Done | Built and verified 2026-09-05/06, merged to `main` via PR #15 (2026-09-06). **2026-09-09: a real end-to-end Google login (not just the redirect-to-Google check) confirmed working** by the user on a different machine — see PROGRESS-LOG. |
| 9b | Settings page + account management (protected route, dashboard nav entry point, saved scenarios list, sign out, delete account) | **Done** | `/settings` is genuinely protected at two independent layers: `src/proxy.ts` (Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts` — same mechanism, confirmed by reading Next's own build source rather than guessing; also refreshes the Supabase session cookie on every request, since Server Components can't write cookies themselves) redirects unauthenticated visits before any page code runs, and `settings/page.tsx` independently redirects too via `getServerUser()` — neither depends on the other. Dashboard nav gained a dropdown menu (Settings / Saved Scenarios / Sign out) off the user's Google avatar, replacing an earlier bare-link version that wasn't discoverable enough — new `dropdown-menu.tsx` component. Avatar images were briefly broken in local dev: root-caused (not guessed) to Google's profile-photo CDN rate-limiting requests carrying a `localhost` referrer — confirmed via direct `curl` tests with/without a `Referer` header — fixed with `referrerPolicy="no-referrer"` on the `<img>`. Saved Scenarios panel shows a real list (name, optional note, total, date), each entry a real link that loads that scenario back into the dashboard (`?scenario=<id>`, see step 9's entry for the security details). Delete account: new `AlertDialog` component, confirmed destructively, then one call to `supabase.auth.admin.deleteUser()` — deliberately does NOT attempt to revoke the Google OAuth grant (the user's own data, already under their control, never ours to manage) and needs no separate scenarios-delete step (`on delete cascade`, enforced by Postgres). Four presentational/UI pieces built by parallel sub-agents across two rounds against fixed contracts; all auth/security/Server Action/proxy code built directly. `tsc`/lint/60 tests/production build all clean. **2026-09-09: the real signed-in settings experience confirmed working** (avatar, welcome text, real account/scenario data, sign out, delete account, scenario notes/loading) by the user on a different machine — see PROGRESS-LOG. |
| 10 | Build the results/print page | **Built and verified, 2026-09-08** | `/dashboard/results` — a Server Component fetches cached rates, a Client Component (`ResultsShell`) reads `selections` back out of `sessionStorage` (never in the `useState` initializer directly — that would create a server/client hydration mismatch, since `sessionStorage` doesn't exist during SSR) and recomputes the breakdown live via the same `calculateTotal`/category functions the dashboard uses — never a stored/stale number, single source of truth preserved. Print/PDF handled with plain CSS, not a separate code path: `@page { size: letter; margin: 0.75in }` in `globals.css` (confirmed present via a real DOM query, not just visual inspection) plus Tailwind's `print:hidden`/`print:p-0`/`print:ring-0` on the on-screen-only chrome and the content card (also confirmed via a real DOM query of applied classes) — a browser's "Save as PDF" is a print destination, not a different renderer, so this one set of rules covers both. **"Generate" restored as its own button in `SummaryBar`** (separate from the since-relabeled "Save"), available to guests too since it never touches the database, gated on `validation.valid`. **A real bug found and fixed during testing, not assumed away:** the sessionStorage persistence layer (`DashboardShell`) had a genuine race condition — the write-effect could fire on the very first render, before rehydration completed, clobbering real stored data with the fresh-mount default. Found via direct `sessionStorage` inspection after a refresh (not just visual symptoms), fixed with a `hydrated` state gate so the write-effect can't fire until rehydration has actually landed in that same render (React 18 batches the two `setState` calls together). Confirmed the fix with a deterministic test (seeded `sessionStorage` directly, watched the actual effect log sequence) plus a full real click-through round trip: fill form → refresh → same numbers persist; Generate → results page → Back to dashboard → same numbers persist throughout. `tsc`/lint/60 tests/production build all clean. |
| 11 | Build the AI natural-language input feature (Route Handler) | **Done** | 2026-09-15: full pipeline built and verified live — Route Handler, provider-swappable architecture, dynamic-schema validation (`verifyAiPatch.ts`), rate limiting, logging, `/privacy` disclosure, chat UI. **2026-09-16: extended with `evaluateBudget`** (real budget/"what if" checks, never AI-computed), per-request known-selections context, a reply-text safety net (dollar amounts + stripped links), and two visually-polished chat components (photo preview, budget comparison card). Known, safe, documented limitation: at most one tool call handled per model turn — see `## AI natural-language input feature` above. |
| 12 | Set up the AWS scraper pipeline (S3, Lambda, EventBridge, IAM) | **Done** | Manual `npm run scrape` / `npm run promote` pipeline built and run for real against 2026-2027 data (2026-08-30). S3 housing photos built 2026-09-15. **2026-09-15/16: Lambda automation of the scrape-into-staging trigger built and verified end to end** — Secrets Manager secret, 3 least-privilege IAM roles, the Lambda function itself, and a monthly EventBridge Scheduler cron. Real manual "Test" invoke in the console succeeded with zero errors across all six scrape groups. Promotion deliberately stays manual (`npm run promote`), by design — never automated. See `## AWS Lambda scraper automation` above for the full setup. |
| 13 | Set up CI/CD (GitHub Actions lint/build, Vercel auto-deploy) | **Done** | GitHub Actions lint/build done 2026-08-23. **2026-09-17: deployed to Vercel** — [umd-bill-estimator.vercel.app](https://umd-bill-estimator.vercel.app/), Supabase env vars synced via the official Vercel-Supabase integration, `GEMINI_API_KEY`/AWS photo-reader vars added manually. Auto-deploy on push to `main` confirmed working (Vercel's default behavior once a project is imported). |
| 14 | Polish, accessibility pass, deploy | **Partial** | **2026-09-17: the polish pass itself is done** — see `docs/POLISH-CHECKLIST.md` for the full itemized list (privacy page rewrite, legal disclaimers, guest sign-in entry point, real mobile-viewport pass with 2 real bugs fixed, dark mode (manual toggle + OS-preference default, verified across every page), preview-card redesign, 3 targeted UI animations, README trim). Deploy is done (this row + step 13). **Not done: the accessibility pass** — no dedicated keyboard-nav/aria-label/color-contrast audit has happened yet, and a couple of small discoverability/meta items are still open (see checklist). |

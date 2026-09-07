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
- `ANTHROPIC_API_KEY` or `GOOGLE_API_KEY` — AI feature, server-only
- AWS credentials — only needed for local scraper testing; the deployed Lambda uses its IAM role instead

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
| 9 | Build the Generate/save flow (Server Action → `scenarios` table) | **Blocked on Google OAuth wiring** | Corrected 2026-09-04 — previously reported as unblocked, that was wrong. `scenarios.user_id` is `not null references auth.users`, and the read RLS policy is `auth.uid() = user_id` — there is no way to insert or read back a scenario without a real authenticated session. `/sign-in` screen exists (2026-09-02) but the actual Google Cloud Console + Supabase provider wiring is still a no-op TODO — that has to land first. |
| 9a | Google OAuth wiring (Google Cloud Console client + Supabase provider config + real sign-in call in `AuthShell.tsx` + auth callback route) | Not started | Real prerequisite for step 9, not previously tracked as its own line item |
| 10 | Build the results/print page | Not started | Blocked on step 9 |
| 11 | Build the AI natural-language input feature (Route Handler) | Not started — genuinely unblocked | Only needs the live UI/calc pipeline to parse into, which doesn't require auth — this one's sequencing call still holds |
| 12 | Set up the AWS scraper pipeline (S3, Lambda, EventBridge, IAM) | Partial | Manual `npm run scrape` / `npm run promote` pipeline built and run for real against 2026-2027 data (2026-08-30). Lambda/EventBridge automation of the trigger still deferred — not blocking anything, promotion is meant to stay a manual human decision anyway. |
| 13 | Set up CI/CD (GitHub Actions lint/build, Vercel auto-deploy) | Partial | GitHub Actions lint/build done 2026-08-23. Vercel auto-deploy not connected. |
| 14 | Polish, accessibility pass, deploy | Not started | |

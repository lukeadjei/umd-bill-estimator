# Progress Log — UMD Bill Estimator

Dated, append-only record of what actually got done, one entry per work session. Separate from the Decisions & Ideas Log in `docs/umd-bill-estimator-getting-started-checklist.md` (that's *why* — this is *what, and when*). Newest entry on top.

---

### 2026-08-29

- Reworked the calculation engine to be semester-scoped: `calculateTotal` now computes one semester (fall or spring) at a time instead of an annual figure, per a deliberate product decision to let users flip between semester views in the UI (annual rollup deferred to later). `calculateHousing` halves the annual rate; `calculateInsurance` and resident `calculateDining` pick that semester's price instead of summing fall+spring; `calculateParking` charges the full permit price regardless of semester/term (matches how UMD actually bills it, confirmed).
- Added `living_situation` (`'on_campus'`/`'commuter'`) to `scenarios` via migration — closes the "null housing could mean commuter or could mean unanswered" ambiguity flagged a few sessions back. Not yet wired into the `Selections` type — that lands with `validateSelections`, the next piece, since nothing in the calc engine itself needs it.
- Test suite grew from 23 to 27 cases covering the semester-scoping changes.
- PR #6 merged to `main`. Verified a clean checkout passes `npm ci` + lint + test + build.

### 2026-08-26

- Built the calculation engine: `calculateTuition`, `calculateDifferentialTuition`, `calculateFees`, `calculateInsurance`, `calculateHousing`, `calculateDining`, `calculateParking`, composed by `calculateTotal` (`src/lib/calculator/calculateTotal.ts`). All pure — no DB calls — receive a full `RatesBundle` of already-fetched reference data plus the user's `Selections` and just do the math/branching.
- Generated real TypeScript types from the live schema (`supabase gen types typescript --linked` → `src/lib/supabase/database.types.ts`) instead of hand-typing rate row shapes.
- Follow-up migration (`20260827032535_add_credit_thresholds.sql`): added `undergrad_tuition_full_time_credit_threshold` and `full_time_fee_credit_threshold` to `academic_years` — these two thresholds (12 credits for tuition, 9 for fees, confirmed different from each other) were never actually stored anywhere before this, only ever described in prose. Will be scraped/populated like the rest of the rate data rather than hardcoded.
- Corrected an assumption mid-build: graduate tuition has no full-time flat rate at all (always per-credit × credit hours) — confirmed this matches the original schema design, no migration needed there. Differential tuition for graduate students is assumed **not applicable** for now (unconfirmed, flagged in code with a comment) — grad tuition/fees otherwise mirror undergrad's shape with their own rate tables.
- Added Vitest, 23 unit tests covering every branch of every calculation function (`src/lib/calculator/calculateTotal.test.ts`), and wired `npm run test` into `.github/workflows/ci.yml` between lint and build.
- PR #5 merged to `main`. Verified a clean checkout of `main` passes `npm ci` + lint + test + build end to end.

### 2026-08-24

- Created the Supabase project, installed/linked the Supabase CLI (pinned as a devDependency), wrote and pushed the first migration (`supabase/migrations/20260824043213_init_schema.sql`): all 11 reference tables + `scenarios`, RLS enabled on every table.
- RLS design: reference tables are publicly readable (no write policies — populated later by the staged/reviewed scraper process); `scenarios` is owner-only reads (`auth.uid() = user_id`) with **no** public write policies at all — every create/update/delete has to go through a Next.js Server Action using the service_role key, so writes always pass through `calculateTotal`/`validateSelections` and can't be forged by calling the Supabase API directly.
- Hit the same `npm ci` EUSAGE lockfile failure a second time after adding the `supabase` CLI package — same root cause as 08-23 (Windows install doesn't resolve Linux-only optional deps), fixed the same way. Now a standing practice going forward: full lockfile regen + `npm ci` verification after every package addition, before pushing.
- Decided against committing `.env.example` — var names/setup instructions stay documented in `docs/BUILD-REFERENCE.md` instead.
- PRs #3 (CI lockfile fix) and #4 (Supabase setup + schema) merged to `main`.

### 2026-08-23

- Scaffolded Next.js (App Router) + TypeScript + Tailwind v4 into the repo root, preserving existing `CLAUDE.md`, `README.md`, `LICENSE`, `docs/`. Verified with `npm run build` and a local dev server check.
- Added `.gitignore` (repo didn't have one yet — now that the stack is locked in, per the checklist's own "hold off until stack is locked in" rule).
- Added `.github/workflows/ci.yml` — runs `npm ci`, `npm run lint`, `npm run build` on every PR into `main` and on push to `main`.
- Branch protection turned on for `main` (done directly in GitHub settings).
- Checked off completed items in `docs/umd-bill-estimator-getting-started-checklist.md`; flagged one open discrepancy — CLAUDE.md references `docs/PLAN.md`/`docs/DECISIONS.md` as separate files, but that content currently lives inside the checklist doc instead.


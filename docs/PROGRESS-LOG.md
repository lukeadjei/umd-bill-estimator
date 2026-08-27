# Progress Log — UMD Bill Estimator

Dated, append-only record of what actually got done, one entry per work session. Separate from the Decisions & Ideas Log in `docs/umd-bill-estimator-getting-started-checklist.md` (that's *why* — this is *what, and when*). Newest entry on top.

---

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


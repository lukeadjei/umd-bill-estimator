# Progress Log — UMD Bill Estimator

Dated, append-only record of what actually got done, one entry per work session. Separate from the Decisions & Ideas Log in `docs/umd-bill-estimator-getting-started-checklist.md` (that's *why* — this is *what, and when*). Newest entry on top.

---

### 2026-08-23

- Scaffolded Next.js (App Router) + TypeScript + Tailwind v4 into the repo root, preserving existing `CLAUDE.md`, `README.md`, `LICENSE`, `docs/`. Verified with `npm run build` and a local dev server check.
- Added `.gitignore` (repo didn't have one yet — now that the stack is locked in, per the checklist's own "hold off until stack is locked in" rule).
- Added `.github/workflows/ci.yml` — runs `npm ci`, `npm run lint`, `npm run build` on every PR into `main` and on push to `main`.
- Branch protection turned on for `main` (done directly in GitHub settings).
- Checked off completed items in `docs/umd-bill-estimator-getting-started-checklist.md`; flagged one open discrepancy — CLAUDE.md references `docs/PLAN.md`/`docs/DECISIONS.md` as separate files, but that content currently lives inside the checklist doc instead.


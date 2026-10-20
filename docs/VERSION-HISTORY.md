# Version History — UMD Bill Estimator

Tracks what each version set out to do and what got done.

**Reading rule: only read the version marked `[OPEN]`. Skip every `[CLOSED]` version — its summary is history, not context.** (Exception: v1's "Carried over" list is copied into v2's backlog when v2 is planned, so nothing needs to be re-read from v1.)

**Update rule: after every implementation or code write, update the open version's task checkboxes and add a dated line to its Work log** — what changed, what's verified, what's still in progress — so a new session knows exactly where things stand.

For how the app is currently built, see `docs/BUILD-REFERENCE.md`. Older session-by-session detail is archived in `docs/PROGRESS-LOG.md` (closed, never appended to).

---

## v2 `[OPEN]`

### Goal
_To be defined with the developer._

### Plan
_To be defined._

### Tasks
- [ ] _None yet._

### Backlog (carried over from v1)
- [ ] Accessibility pass — keyboard navigation, aria labels, color contrast audit
- [ ] Open Graph / social-preview metadata (`layout.tsx` only has `title`/`description`)
- [ ] Surface the feedback Google Form in the app itself (currently only linked from `/privacy`)
- [ ] Chat "Assistant is typing…" indicator → CSS three-dot bounce
- [ ] Optional: celebratory micro-animation when a guest first generates a complete plan
- [ ] AI chat: handle multiple tool calls in one model turn (needs `AiProvider.continueWithToolResult` extended to multiple call/result pairs); v1 handles at most one per turn
- [ ] Pruning job for `ai_parse_logs` (meant to be short-retention, 14–30 days; not built)

### Work log
_(newest first)_

---

## v1 `[CLOSED]`

First complete, deployed version: [umd-bill-estimator.vercel.app](https://umd-bill-estimator.vercel.app/). Built 2026-08-23 → 2026-09-17.

### What was built
- **Repo & CI/CD** — public GitHub repo, MIT license, branch protection, GitHub Actions (lint/test/build), Vercel auto-deploy from `main`.
- **Database** — Supabase schema with RLS: rate tables per academic year, `_staging` twins, `scenarios`, AI logging/rate-limit tables.
- **Calculation engine** — pure `calculateTotal` (+ per-category functions, `calculateAid`, `calculateNetTotal`) and a separate `validateSelections`, with unit tests.
- **Dashboard** — tabbed selection UI (Major, Tuition, Housing, Parking, Meals, Aid & Grants) with live recomputed total, validation, per-selection descriptions and housing photos, sessionStorage persistence.
- **Auth & accounts** — Google OAuth, protected `/settings` (two independent layers), saved scenarios (save with note, load back, delete), delete account.
- **Results page** — printable/PDF bill via CSS `@page`; also a read-only view of saved scenarios (works for past academic years).
- **Aid & grants** — Pell, Terrapin Commitment, Rawlings EA, up to 5 misc grants; before/after-aid totals and refund display.
- **Academic-year rollover** — `academic-year:create` / `activate` scripts, per-year cached rates, past-year scenarios locked from editing.
- **Scraper pipeline** — one scraper per UMD source → staging → manual `promote`; automated monthly via AWS Lambda + EventBridge, secrets in Secrets Manager, least-privilege IAM.
- **S3 housing photos** — folder-per-room-type/building-category, discovered at request time.
- **AI chat** — Gemini via a swappable provider interface; `setSelections`, `getHousingPhotos`, `evaluateBudget` tools; `verifyAiPatch` and `verifyReplyText` safety nets; Postgres-backed rate limiting; request logging.
- **Polish** — privacy page rewrite, accuracy/affiliation disclaimers, guest sign-in entry point, mobile-viewport fixes, dark mode, UI animations, README.

### Closed with these not done
See the v2 Backlog above — all carried over.

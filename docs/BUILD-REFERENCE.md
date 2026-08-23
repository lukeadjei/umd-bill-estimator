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

## Testing
- Vitest for unit tests, focused almost entirely on `calculateTotal`/`validateSelections` and their sub-functions — pure functions, cheap and high-value to test
- Skip E2E/UI testing (Playwright, etc.) for v1 — low payoff at this stage, revisit later if desired

---

## Build order

1. Repo setup — public GitHub repo, MIT license, branch protection, `docs/` folder
2. Supabase fundamentals learning session (prerequisite)
3. Scaffold Next.js + TypeScript + Tailwind
4. Create Supabase project, build out the full schema
5. Set environment variables
6. Build the calculation engine (pure functions) + unit tests — do this early, it's the highest-value piece
7. Build `validateSelections`
8. Build the selection UI with live-updating total (recompute pattern)
9. Build the Generate/save flow (Server Action → `scenarios` table)
10. Build the results/print page
11. Build the AI natural-language input feature (Route Handler)
12. Set up the AWS scraper pipeline (S3, Lambda, EventBridge, IAM)
13. Set up CI/CD (GitHub Actions lint/build, Vercel auto-deploy)
14. Polish, accessibility pass, deploy

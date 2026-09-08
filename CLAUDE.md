# CLAUDE.md

## Project
UMD Bill Estimator — a web app that estimates a University of Maryland student's total cost (tuition, fees, housing, dining, parking) by combining official UMD rate data with a student's own selections. This is a personal portfolio/resume project, not an official UMD product — the UI must always make clear it's unofficial and unaffiliated.

## Stack
- Next.js (App Router), TypeScript, Tailwind
- Supabase (Postgres + Auth) — main database and user accounts
- AWS: S3 (hall photos), Lambda (scheduled scraper), EventBridge Scheduler (triggers Lambda), IAM (least-privilege roles between them)
- AI: Claude or Gemini API via function calling, for natural-language input parsing

## Critical rules — do not violate these

1. **The AI never computes dollar amounts.** It only parses natural language into structured selections (which tuition rate, housing type, dining plan, etc.). `calculateTotal()` is the only function allowed to produce a price, anywhere in the codebase.
2. **Calculation functions are pure.** No side effects, no database calls inside them, no mutating a running total. Same inputs must always produce the same output. This is what makes them unit-testable.
3. **Recompute, don't accumulate.** The live total shown in the UI is recalculated from the full current selection state on every change — never incrementally added to or subtracted from as the user picks things.
4. **Calculation and validation are separate concerns.** `calculateTotal` never checks whether a selection is required or missing — it prices whatever is selected and treats a missing/null selection as $0 for that line. `validateSelections` is the only place "is this required" logic belongs, and it distinguishes always-required fields (tuition, credit hours) from conditionally-required ones (dining plan, only required for certain housing types).
5. **Don't add a database column or table for a dimension that doesn't actually vary.** If a value is identical across some category (e.g. a fee that doesn't differ by residency), it doesn't get its own column/table for that category — see `docs/PLAN.md` for the reasoning trail on several of these calls.
6. **Scraped rate data always goes through a staging/review step.** Never write scraped values directly into the live tables the app reads from.

## Database schema (Supabase/Postgres)

Every table below has an `academic_year_id` foreign key to `academic_years`, which is how a new year's rates become a data insert instead of a code change.

- `academic_years` — label
- `tuition_rates` — residency, full_time_rate, per_credit_rate
- `mandatory_fees` — part_time_rate (1-8 credits), full_time_rate (9+)
- `differential_tuition` — full_time_rate, per_credit_rate (uniform across qualifying majors)
- `housing_rates` — room_type, building_category, rate (full academic year total, not per semester)
- `resident_dining_plans` — plan_name, dining_dollars, guest_passes, fall_price, spring_price
- `block_dining_plans` — plan_label, meal_count, dining_dollars, price
- `parking_permits` — permit_type, term, price
- `graduate_tuition_rates` — residency, per_credit_rate (no flat full-time rate exists for grad tuition)
- `graduate_fees` — part_time_rate, full_time_rate
- `health_insurance_rates` — fall_price, spring_price (shared rate for undergrad and grad; eligibility threshold differs — see below)
- `scenarios` — user_id (FK to Supabase `auth.users`), name, academic_year_id, major, credit_hours, applies_differential_tuition, tuition_rate_id, housing_rate_id (nullable), resident_dining_plan_id (nullable), block_dining_plan_id (nullable), parking_permit_id (nullable), computed_total, created_at, updated_at

**Known business rules to encode in `validateSelections` / the calculation engine:**
- A dining plan is required unless the selected housing has a kitchen (Apartment category only).
- A scenario should never have both `resident_dining_plan_id` and `block_dining_plan_id` set — not enforced by the database, must be enforced in application code.
- Health insurance eligibility differs by student level: undergrad triggers at 6+ credits, grad triggers at 48+ units/semester (or 36 in a 12-week term) — a different threshold and a different unit system, not just a different number.

## Code organization conventions

- Before creating a new folder anywhere in the codebase, check whether a folder with that name (or a near-duplicate purpose) already exists elsewhere in the tree — don't create a second `panels/`, `actions.ts`, etc. in a different location when an existing one already serves that role, and don't give two different folders overlapping names/purposes. Keep new files/folders organized consistently with the existing structure rather than bolting on a parallel convention.

## Working style with the developer

This project is being built for internship prep — the goal is code the developer can defend in an interview, not just code that works. Calibrate what to build autonomously vs. what to work through together:

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

Rule of thumb: if it's something an interviewer could plausibly ask him to explain, make sure he understands it deeply, even if you write the first draft. If it's plumbing that just needs to exist and work, build it.

## Where to find more context

- `docs/PLAN.md` — full project plan, sprint breakdown, professional-workflow notes
- `docs/DECISIONS.md` — running log of research findings and design decisions with reasoning
- `docs/HOUSING-DINING-RULES.md` — housing/dining eligibility rules in detail
- `docs/PARKING-RULES.md` — parking permit types and rules in detail
- `docs/DATA-SOURCES.md` — every scrape source URL, organized by category
- `docs/BUILD-REFERENCE.md` — condensed build order and stack summary

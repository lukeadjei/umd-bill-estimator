# Getting Started Checklist — UMD Bill Estimator

Work through this top to bottom before you write your first line of application code.

---

## Phase 1: Research (search this up first)

- [x] Tuition rates — in-state, out-of-state, per-credit rate, and the flat-rate credit threshold *(source found: billpay.umd.edu/UndergraduateTuition — see Decisions & Ideas Log)*
- [x] Differential tuition — which colleges/majors charge extra, and how much *(found on same page: Business/Engineering/CMSC juniors & seniors)*
- [x] Mandatory fee schedule — current amounts for tech, facilities, health, transportation, activities, and athletics fees *(fee breakdown table found on same page)*
- [x] Academic calendar / billing structure — billed per semester? Do fees stay flat regardless of credit load? *(confirmed: rates published per academic year, covering Fall + Spring together)*
- [x] Mandatory Student Health Insurance (SHIP) — required for 6+ credit students unless waived with proof of other coverage. Fall $1,232 + Spring $1,707 = $2,939/year. *(source: same billpay.umd.edu page as tuition)*
- [ ] New Student Orientation fee — confirmed mandatory for all new degree-seeking students, billed to student account; exact dollar amount still needed *(source: orientation.umd.edu/paying-new-student-orientation)*
- [ ] Housing rates — Res Life rate sheet, by hall and room type *(source found: reslife.umd.edu/apply-housing/rates-terms — rate grid confirmed, still need hall→category mapping, see below)*
- [x] Hall → building category mapping — found via reslife.umd.edu/explore-halls/at-glance ("Halls at a Glance"); good enough for a real hall-selector feature. Remaining gaps (Suite vs. Apartment kitchen split, "New Traditional" specifics) logged below.
- [x] Meal plan tiers — plan names, meal counts, dining dollars, prices; note any hall-specific plan requirements *(source found: dining.umd.edu/students/resident-plans — see Decisions & Ideas Log)*
- [x] Parking permits — DOTS permit types, zones, and prices *(source found: transportation.umd.edu/parking/students/fees-and-permit-types — see docs/PARKING-RULES.md)*
- [x] How Testudo itemizes a real bill — checked firsthand: it's itemized but dense and clumped together, hard to parse. **Design decision, not a research gap:** don't mimic Testudo's format — lean into being the clean, visual, well-organized alternative. This is the core differentiation, not just a nice-to-have.
- [x] Competitive check — checked informally, found no existing tool that does this. Worth a quick re-check closer to launch for a stronger README claim, but not urgent.
- [ ] Trademark/branding check — confirm you're clear to reference "UMD" and add an "unofficial, unaffiliated" disclaimer

---

## Phase 2: Design Decisions (decide before coding)

- [x] Entity/schema list — sketch out: `TuitionRate`, `Fee`, `HousingOption`, `MealPlan`, `ParkingPermit`, `Scenario`, `AcademicYear` *(complete — 8 reference tables + scenarios, see Decisions & Ideas Log; fraternity housing, parking bundle packs/carpool, and orientation fee deliberately deferred)*
- [ ] Calculation engine approach — pure functions vs. config-driven rules
- [ ] Data storage — static JSON/config vs. Supabase tables *(decision: Supabase confirmed as main DB/auth — see Decisions & Ideas Log for AWS add-ons)*
- [ ] User flow — selection form → itemized breakdown → optional save/share/compare
- [ ] MVP feature list vs. stretch features — write it down explicitly
- [ ] API/route design — Next.js confirmed as the framework (see Decisions & Ideas Log); still open: server actions vs. API routes specifically
- [ ] AI feature scope — decide priority order: (1) natural-language input parsing, (2) Q&A/chatbot about a computed scenario, (3) AI-recommended plan. Core rule for all three: AI parses input or explains output — the calculation engine is the only thing allowed to produce dollar amounts.

---

## Phase 3: Repo & Environment Setup

- [x] Create GitHub repo — `umd-bill-estimator`, public
- [x] Add a README — keep it lean: problem statement, tech stack, how to run locally, "unofficial/unaffiliated" disclaimer *(exists, currently a stub — flesh out before this is portfolio-ready)*
- [x] Add MIT license
- [ ] Create a `docs/` folder with `RESEARCH.md`, `DECISIONS.md`, and `PLAN.md` *(docs/ exists, but as differently-named files — CLAUDE.md references `docs/PLAN.md` and `docs/DECISIONS.md` which don't exist yet as literal files; the content currently lives inside this checklist's Decisions & Ideas Log instead. Worth reconciling — see note below.)*
- [ ] Copy this checklist into `docs/PLAN.md` — make it one of your first commits, before any app code
- [x] Hold off on `.gitignore` until your stack is locked in — add it before your first `.env` file exists, not necessarily before your first commit *(added 2026-08-23 alongside the Next.js scaffold)*
- [x] Turn on branch protection for `main` — require PRs before merging
- [ ] Set up a GitHub Projects board — Backlog / In Progress / Done
- [x] Scaffold Next.js + TypeScript + Tailwind *(2026-08-23)*
- [x] Set up Supabase project *(2026-08-24 — project created, CLI linked, full schema migrated: 11 reference tables + `scenarios`, RLS enabled — owner-only reads on `scenarios`, public reads on reference tables, all writes locked to the service role. `.env.example` deliberately not included — real var names/setup live in `docs/BUILD-REFERENCE.md` instead.)*
- [ ] Set up ESLint + Prettier *(ESLint came with the Next.js scaffold; Prettier not yet added)*
- [x] Set up GitHub Actions CI — lint + build on every PR *(2026-08-23, see `.github/workflows/ci.yml`)*
- [ ] Connect Vercel for PR preview deployments

---

## Git Workflow Quick Reference

For every new feature or fix:

1. `git checkout -b feat/branch-name` off an updated `main`
2. Commit as you work
3. `git push -u origin feat/branch-name` (first push only, then just `git push`)
4. Open a PR on GitHub — describe what changed and why
5. Review your own diff
6. Squash & merge
7. Delete the branch, then `git checkout main && git pull`

Naming: `feat/` for new features, `fix/` for bug fixes, `chore/` for config/setup.

---

## Once Setup Is Done

Move into the build sprints (data layer → calculation engine → core UI → results UI → auth/persistence → AI natural-language mode → polish → test & deploy) — see your full project plan doc for the sprint-by-sprint breakdown.

---

## Pages Checklist

Started 2026-08-30, once the homepage was far enough along to plan the rest of the app around it. Answers the still-open "User flow" item in Phase 2 above.

- [x] **Homepage** (`/`) — hero, disclaimer, illustrations, preview-card stack. Layout/styling essentially done; still open: real content for the Housing/Dining/Parking preview cards (blocked on those features existing) and optional scroll/motion polish beyond the entrance-fade + hover-lift already in place.
- [ ] **Auth page** (`/sign-in` or similar) — sign in and create account. Recommend one combined page with a toggle between the two modes rather than separate routes — less to build, and Supabase Auth's email/password + OAuth flows fit a single form either way. Needs a password-reset flow too ("forgot password") — easy to forget since it's not a page anyone thinks of until it's missing.
- [ ] **Main dashboard** (`/dashboard`) — skeleton built 2026-09-02: bubble-tab nav (Major/Tuition/Housing/Parking/Meals), collapsible AI chat panel, placeholder summary bar. Still open: real `calculateTotal` wiring, real Supabase data (rates + majors list), the AI parse-to-selections call, and persistence (save scenario → results page).
- [ ] **Settings page** (`/settings`) — account info, delete-account/delete-data, and saved scenarios. Worth deciding explicitly: does "saved scenarios" get its own page/route (`/scenarios`), or live as a section/tab inside Settings? Either works — flagging so it's a deliberate call, not a default.
- [ ] **Privacy/data policy page** — the footer already has a literal placeholder line for this ("real privacy/data policy goes here once that page exists"), so the footer link is currently dead. Needed before this is truly portfolio-ready, not just a nice-to-have.
- [ ] **About / methodology page** — explains what the estimator does, how the numbers are sourced (scraper → staging → manual review → live tables), and restates the unofficial/unaffiliated disclaimer in more depth than the homepage's one-liner. Good for interview credibility ("how do you know your data is right?") and reusable as README content.
- [ ] **404 / not-found page** — cheap in Next.js (`app/not-found.tsx`), easy polish item, currently missing.

---

## Backlog

Small, real to-dos that aren't a whole page/phase on their own — noted here so they don't get lost.

- [ ] **Scraper: fetch the real major list.** The dashboard's Major tab is currently a free-text input as a placeholder — needs the scraper to pull UMD's actual major list (and, later, which ones carry differential tuition) so it can become a real search/select. Not urgent, revisit after the dashboard's core selections are wired to real data.

---

## Decisions & Ideas Log

Running record of choices made and why — copy this into `docs/DECISIONS.md` once your repo exists, and keep appending as you go.

### Aug 17, 2026

- **License: MIT.** Chosen for openness/portfolio visibility. Ideas aren't protected by copyright/licensing anyway — only written code is — so this doesn't change exposure around someone "stealing the idea."
- **Repo visibility: public, from day one.** A commit history that builds up over weeks is itself a positive signal for a portfolio project, vs. a private repo flipped public right before applying.
- **`.gitignore` timing: hold off until the tech stack is locked in.** Must exist before the first `.env` file is created — not necessarily before the first commit.
- **Documentation structure:** keep `README.md` lean (what/stack/how-to-run/disclaimer). Deeper research notes, decisions, and the plan/checklist live in a `docs/` folder instead (`RESEARCH.md`, `DECISIONS.md`, `PLAN.md`).
- **Tuition data source found:** [billpay.umd.edu/UndergraduateTuition](https://billpay.umd.edu/UndergraduateTuition) — publishes resident/non-resident tuition, mandatory fee breakdown, and differential tuition (Business/Engineering/CMSC juniors & seniors) together for a combined Fall+Spring academic year cycle. Note: the university reserves the right to change fees without notice, so treat scraped data as "true as of last check," not permanent.
- **Scraping method: plain HTTP fetch + Cheerio, not Puppeteer.** The billpay tuition page is server-rendered — the data is present in the raw HTML — so no headless browser is needed. Rule of thumb going forward: check "View Page Source"; if the data's there, fetch + Cheerio is enough.
- **Data freshness strategy:** since tuition data changes ~once/year, the live app should NOT depend on real-time scraping. Scraper writes to a staging table with a `last_scraped_at` timestamp; changes get manually reviewed/approved before going live. Feeds into the "rate update runbook" idea.
- **Open action item:** check `billpay.umd.edu` robots.txt / terms of use before building the scraper (not yet done).
- **Housing rate structure found:** [reslife.umd.edu/apply-housing/rates-terms](https://reslife.umd.edu/apply-housing/rates-terms) — pricing is a grid of Room Type (Single, Double, Triple/Quad, etc.) × Building Category (Traditional Without AC, Traditional With AC, New Traditional, Semi-Suite, Suite, Apartment). "None" in a cell means that combination doesn't exist. The page does NOT map specific hall names to a category — that's a separate lookup still needed.
- **Housing rate is a full-academic-year total, not per semester.** Confirmed via the 2026-2027 Terms & Conditions: the student agrees to pay the full academic year of housing costs. It's billed in two installments (~1 month before each semester), but the number on the rate sheet is the annual figure — don't double it when combining with tuition, and divide by 2 if you want a "per semester" display.
- **Meal plan data source found:** [dining.umd.edu/students/resident-plans](https://dining.umd.edu/students/resident-plans) — 4 tiers (Base, Base Plus, Preferred, Premium), each with unlimited dining hall access, priced **per semester** (unlike housing, Fall and Spring are separate equal charges here, not one annual total).
- **Business rule found:** all residence hall students are required to carry a resident dining plan unless they're in a kitchen-equipped apartment — worth encoding as a constraint in the calculation engine (housing selection can force/restrict dining plan options).
- **Housing rates confirmed uniform per category, not per specific hall** — e.g. Cambridge, Denton, Ellicott, and Heritage/Oakland are all "Traditional/Semi-Suite" North Campus halls billed at the same category rate. Rate depends on room type × building category only.
- **"Apartment" category defined:** on-campus units with a full kitchen and dining room, 3–5 bedrooms, houses up to 8 students — the only category with a kitchen, which is why it's the only one eligible for a dining plan exemption.
- **Full business rules moved to a separate reference doc:** `docs/HOUSING-DINING-RULES.md` (kitchen → dining plan requirement, defaults, housing term length, commuter path, differential tuition independence). Keep this separate from the checklist — it's rules, not tasks.
- **Full hall category breakdown found** (source: reslife.umd.edu/explore-halls/residence-halls): Traditional (23 halls), Semi-Suite (Oakland, Prince Frederick), Apartment/Suite (15 halls: Allegany, Baltimore, Calvert, Charles, Frederick, Garrett, Harford, Howard, Kent, Leonardtown, Montgomery, Prince George's, St. Mary's, Talbot, Washington). UMD does NOT publicly split which of the 15 apartment/suite halls have kitchens (Apartment) vs. don't (Suite) — and some halls (Prince Frederick, Cecil) span multiple categories within the same building.
- **Scope decision REVISED:** found a much richer source — [reslife.umd.edu/explore-halls/at-glance](https://reslife.umd.edu/explore-halls/at-glance) ("Halls at a Glance") maps nearly every hall to its category (Traditional / Semi-Suite / Suites & Apartments) AND to AC status individually. This makes a real hall-selector feature cheap enough to include in v1 after all — walking back the earlier "skip it" call. Still open: which Suites & Apartments halls have a kitchen (Apartment) vs. don't (Suite), and which specific halls are "New Traditional" vs. just "Traditional With AC."
- **Fairness note (not a rate, just context):** UMD's rate tiers already price for building quality — e.g. 2026-27 Double rooms run $9,216 (Traditional, no AC) → $10,290 (Traditional, AC) → $10,755 (New Traditional). Not a flat rate regardless of building condition.
- **Feature idea — hall selector for organization/UX:** let users pick their specific hall (not just category); auto-fill the rate category from the Halls at a Glance mapping above. Good v1/early-v2 candidate given the data now exists.
- **Feature idea — virtual hall preview:** show the building via Google Street View Static API/embed (clean, designed for this use, generous free tier) rather than scraping UMD's own official hall photos (those are UMD's copyrighted photography — don't hotlink/scrape them). Better alternatives if photos are wanted: take your own photos on campus, or email Res Life to ask permission to use official ones. Bucket as a v2/polish feature.
- **Parking data found:** three permit types (Commuter, Resident, Overnight Storage), each priced Annual/Fall-only/Spring-only/Summer-only. Full pricing and rules moved to `docs/PARKING-RULES.md`, same pattern as the housing/dining rules doc.
- **Pricing quirk to encode:** buying Fall + Spring separately costs more than Annual for every permit type — worth surfacing as a savings tip in the calculator.
- **Rule: permit type depends on residency status**, same shape as the dining plan constraint — cross-reference the housing/living-situation answer to filter which permit types are shown.
- **Also found:** bundle packs ($75/10 one-day permits) as a separate, non-term-based purchase option — relevant for occasional commuters specifically.
- **Completeness audit:** identified two previously-uncategorized bill items — Mandatory Student Health Insurance (SHIP, ~$2,939/year unless waived) and New Student Orientation fee (mandatory for new students, exact amount TBD). Deliberately scoping OUT for v1: housing application fee ($50, minor), international student fee ($125/semester, narrow subset), and course/lab fees (would need registration data, different complexity class).
- **All source URLs consolidated:** `docs/DATA-SOURCES.md` — every confirmed scrape target in one place, organized by category, ready to paste into a Claude Code session as context.
- **Positioning/design insight:** UMD's real bill (Testudo) is itemized but dense and cluttered — that's the actual gap this project fills. Core UX direction: clean, visual breakdown, possibly drag-and-drop for selecting options, rather than mimicking Testudo's format. This is now the project's core pitch, not just a feature.
- **Competitive check closed (informal):** no existing tool found that does UMD-specific interactive bill estimation. Worth a formal re-check closer to launch for a stronger README claim.
- **New feature idea — AI integration**, three possible shapes: (1) natural-language input parsing into structured form selections, (2) Q&A/chatbot about an already-computed scenario, (3) AI-recommended plan based on described priorities. **Priority order for building: #1 first** (safest, most reliably impressive), #2 and #3 later.
- **Architecture rule for all AI features:** the AI parses input or explains output — it never generates dollar amounts itself. Real numbers only ever come from the calculation engine. Implementation pattern: function calling / tool use, where the model calls a `calculateScenario(...)` function with extracted parameters and the actual math runs in real code. Works the same way with Claude's API or Gemini's API — model choice isn't an architecture decision here.
- **Backend decision: Supabase stays as main DB + auth.** Chosen AWS add-ons: **S3** (hall photos / static assets), **Lambda** (scheduled scraper, ties into the earlier rate-update-runbook idea), **EventBridge Scheduler** (triggers the Lambda), **IAM** (least-privilege roles for the Lambda→S3 permission, not a separate feature — just do it properly). Deliberately skipping RDS/Cognito/Amplify — Supabase already covers DB/auth, no need to duplicate.
- **Cost check:** Lambda and EventBridge Scheduler free tiers are permanent (not just 12 months), and S3 costs pennies at this scale even after its 12-month free tier ends — this AWS combo should run ~$0/month indefinitely. Monetization deliberately deprioritized unless real scale/cost becomes an actual problem; GitHub Student Developer Pack / AWS Educate credits are the first lever to check before that, not ads or donations.
- **Framework decision: Next.js confirmed** over a decoupled Vite+React / Express setup (the main alternative considered, given real Express experience from JALT) or Remix. Reasoning: integrated frontend/backend/routing outweighs the value of practicing a fully decoupled architecture right now, and Next.js is the safer resume bet for current internship postings.
- **Tuition schema locked in**, built one piece at a time rather than the full entity list at once: `academic_years` (id, label) is the anchor every pricing table hangs off via foreign key. `tuition_rates` holds residency ('resident'/'non_resident'), full_time_rate, per_credit_rate — one table, not split by residency into two tables, since that would duplicate any values that don't vary by residency (fees, differential tuition) and risk them drifting out of sync. `mandatory_fees` (part_time_rate for 1-8 credits, full_time_rate for 9+) and `differential_tuition` (full_time_rate, per_credit_rate, uniform across Business/Engineering/CS) are separate small tables — neither needs a residency column since neither varies by it. Still open: housing/dining/parking/scenario tables.
- **Housing schema locked in:** `housing_rates` (academic_year_id, room_type, building_category, rate — annual total). No residency column (doesn't vary). "None" cells in the UMD rate grid simply mean no row exists for that room_type × building_category combination — no null/boolean flag needed. Fraternity houses deliberately excluded for now, to be added later.
- **Dining schema locked in, two tables** (not one) — resident plans and block plans are different products with different mechanics, unlike the cases where a single table made sense: `resident_dining_plans` (plan_name, dining_dollars, guest_passes, fall_price, spring_price — kept split by term since it's known other UMD costs like SHIP insurance diverge by term even when a given year happens to show equal numbers) and `block_dining_plans` (plan_label, meal_count, dining_dollars, price — no term split, since the source data showed only one price, not two). Dropped as derived/non-source data: "price above base," "savings %," "meals per week breakdown" (all computable from stored fields, not worth storing), and the marketing persona description text (real UI copy, belongs in the frontend, not the database).
- **Parking schema locked in:** `parking_permits` (permit_type, term, price). Deliberately dropped "expiration date" from the source table — it varies by term only, not by permit type, so adding it as a column would mean storing the same date three times per term; it's operational metadata the calculator doesn't need anyway, same bucket as lot assignment/registration timing scoped out earlier. Bundle packs and carpool discount flagged as a future separate table (different pricing mechanic), not designed yet.
- **Graduate schema added:** `graduate_tuition_rates` (residency, per_credit_rate only — no full-time flat rate exists at the grad level, unlike undergrad) and `graduate_fees` (part_time_rate for 1-8 credits = $382.50, full_time_rate for 9+ = $738.00, same tiered shape as undergrad `mandatory_fees`, separate table since amounts differ).
- **Health insurance:** own table, `health_insurance_rates` (fall_price, spring_price) — confirmed the $2,939/year rate is genuinely shared between undergrad and grad, no student-level column needed on this table. **Important flag for the calculation engine later:** eligibility to be charged this at all differs by level — undergrad triggers at 6+ credits, grad triggers at "full-time" defined as 48+ units/semester (or 36 units in a 12-week term), a different threshold *and* a different unit system than simple credit hours. Not a schema issue, but the eligibility check in the calculation engine can't treat undergrad and grad the same way.
- **`scenarios` table drafted** (not yet fully diagrammed): id, user_id (FK to Supabase `auth.users`), name, academic_year_id, major (string, added for a future major-based dropdown/feature, not yet wired to differential tuition logic), credit_hours, applies_differential_tuition (boolean), tuition_rate_id, housing_rate_id (nullable), resident_dining_plan_id (nullable), block_dining_plan_id (nullable), parking_permit_id (nullable), computed_total, created_at, updated_at. Known constraint: a scenario should never have both a resident and a block dining plan set — not enforced by the database, must be enforced in application code.
- **New Student Orientation fee — researched but deferred, not added to schema.** Data is known if you change your mind later: it varies by program format, not a flat number — Two-Day Overnight $265, One-Day $175, Online $95 (plus a $20 no-show penalty and an optional $99 Terp Family Orientation charge, both out of scope regardless). Same "deliberately deferred" bucket as fraternity housing and parking bundle packs — a decision, not a gap.
- **Schema design phase complete for now** — 8 reference tables (academic_years, tuition_rates, mandatory_fees, differential_tuition, housing_rates, resident_dining_plans, block_dining_plans, parking_permits, graduate_tuition_rates, graduate_fees, health_insurance_rates) plus the drafted scenarios table. Deliberately deferred, not forgotten: fraternity housing, parking bundle packs/carpool discount, New Student Orientation fee.

# UMD Bill Estimator — Build Reference

How the app is **currently built and configured**. This is a structure reference, not a history or status log — what's being worked on lives in `docs/VERSION-HISTORY.md`. Update this file whenever the structure changes (new table, new env var, new service, changed architecture) so it never describes something that no longer exists.

---

## Stack
- Next.js 16 (App Router) + TypeScript + Tailwind, hosted on Vercel (auto-deploys on push to `main`) at umd-bill-estimator.vercel.app
- Supabase — Postgres + Google OAuth
- AWS — S3 (hall photos), Lambda (scraper), EventBridge Scheduler (trigger), Secrets Manager, IAM (least-privilege)
- AI — Gemini (`gemini-3.5-flash-lite`) via function calling, behind a swappable provider interface
- GitHub (public repo, MIT license, branch-protected) + GitHub Actions CI (`npm ci`, lint, test, build)

---

## Database

**Source of truth for columns/types: `src/lib/supabase/database.types.ts` (generated) and `supabase/migrations/`.** This section only records what those files don't make obvious. Both are verified against the live project at the start of every session (see CLAUDE.md "Session start").

**Tables (31):**
- `academic_years` — `label`, `is_current` (partial unique index: only one row can be current), plus `full_time_fee_credit_threshold` and `undergrad_tuition_full_time_credit_threshold` (the credit-hour cutoffs live in the DB, not in code), and `winter_max_credit_hours` (nullable; hand-set, **not** scraped/staged/promoted — null means no winter configured for that year)
- Rate tables, each with an `academic_year_id` FK: `tuition_rates`, `mandatory_fees`, `differential_tuition`, `housing_rates`, `resident_dining_plans`, `block_dining_plans`, `parking_permits`, `graduate_tuition_rates`, `graduate_fees`, `health_insurance_rates`
- Winter Session rates (per academic year): `winter_tuition_rates` (undergrad) and `winter_graduate_tuition_rates` (grad) — one row per (`residency`, `credit_hours`) holding the published **total price** for that many credits (not a per-credit rate; never multiply); `winter_fees` — one row with `campus_services_rate` and `distance_learning_rate`. Unique per year/residency/credit count.
- `<table>_staging` twin for each rate table above (incl. `academic_years_staging` and the 3 winter tables), each with `scraped_at`. Scrapes only ever write here.
- `scenarios` — a user's saved plan (rate-row ids, grants, note, `computed_total`)
- `ai_parse_logs`, `ai_rate_limits` — AI chat logging and rate limiting
- One custom function: `check_and_consume_ai_rate_limit` (atomic rate-limit check + increment)

**Rules no schema file shows (enforced in app code unless noted):**
- Exactly one of `scenarios.tuition_rate_id` / `graduate_tuition_rate_id` is set.
- `resident_dining_plan_id` and `block_dining_plan_id` are never both set.
- DB-enforced: `note` ≤ 100 chars; named grant amounts are `0` or `1–20,000`; `misc_grants` jsonb has ≤ 5 elements. Per-element misc-grant bounds (`0` or `1–100,000`, 50-char note) are checked only in input + Server Action.
- `housing_rates.rate` is the full academic-year total (half per semester).
- Deferred, not forgotten: fraternity housing, parking bundle packs/carpool discount, orientation fee.

**Access model:**
- Live rate tables (incl. `academic_years`): RLS on, public `select` policy.
- `_staging` tables: RLS on, no policies — service-role only.
- `scenarios`: RLS lets a user read only their own rows; **no write policies**, so all writes use the service-role client, which bypasses RLS — every write query must filter on the verified session's `user_id` explicitly. Deleting an auth user cascades to their scenarios.
- `ai_parse_logs`: service-role only (RLS on, no policies).

---

## Calculation engine (`src/lib/calculator/`)
- Pure functions, one per category (tuition, fees, insurance, housing, dining, parking), composed by `calculateTotal()`.
- `calculateTotal` — pricing only, no validation. Missing/null selection = $0 for that line.
- `calculateAid` sums the four grant sources; `calculateNetTotal` = total − aid, **not floored at 0** (negative = estimated refund).
- `validateSelections` — separate; handles always-required (tuition, credit hours) and conditionally-required (dining plan unless housing has a kitchen) fields.
- Totals are recomputed from the full selection state on every change — never accumulated.
- The AI never computes dollar amounts; `calculateTotal` is the only source of prices.
- `RatesBundle.winter` holds the winter tuition/fee rows (null when the year has no usable winter data; built by `src/lib/supabase/buildWinterRates.ts`). `Selections.winterClassFormat` (`in_person` | `online_only` | null) picks the winter fee. Winter pricing/validation arrives in task 5 of v2.
- `majors.ts` — `MAJORS` list and `DIFFERENTIAL_TUITION_MAJORS` (drives the differential-tuition warning).

---

## Data flow / routes
- Reading rate data → Server Components, direct Supabase query via `getRatesBundle()` (cached with `unstable_cache`, 24h; `getRatesBundleForYear()` caches per-year).
- Save / delete scenario, settings actions → Server Actions (`dashboard/actions.ts`, `settings/actions.ts`).
- AI chat → Route Handler `src/app/api/chat/route.ts` (only HTTP entry point for AI).
- `/dashboard` selections persist in `sessionStorage` (read on mount, write gated behind a `hydrated` flag). Precedence: `?scenario=` > sessionStorage > defaults.
- `/dashboard/results` renders the printable bill from sessionStorage; `/dashboard/results?scenario=<id>` renders a saved scenario. Both use the shared `BillDocument` component. Print/PDF is plain CSS (`@page` in `globals.css` + Tailwind `print:` variants).
- Saved scenarios: `resolveScenarioForEditing()` returns `editable` / `locked` / `not_found` (scenarios from a non-current academic year are locked, enforced server-side); `resolveScenarioForViewing()` has no lock and uses that scenario's own year's rates.
- `/settings` is protected twice, independently: `src/proxy.ts` (also refreshes the Supabase session cookie) and `settings/page.tsx`.

---

## Environment variables
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client-safe
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never exposed to the client
- `GEMINI_API_KEY` — server-only, read only in `src/lib/ai/providers/gemini.ts`. `ANTHROPIC_API_KEY` is reserved/unused for a possible Claude-provider swap.
- `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION` — local scraper testing only; the deployed Lambda uses its IAM role
- `AWS_PHOTOS_ACCESS_KEY_ID`/`AWS_PHOTOS_SECRET_ACCESS_KEY`/`AWS_PHOTOS_REGION`/`AWS_PHOTOS_BUCKET` — the app's own read-only S3 access (IAM user `app-photo-reader`); deliberately separate from the scraper's `AWS_*` vars
- `SUPABASE_SECRET_ARN`, `NEXT_PUBLIC_SUPABASE_URL` — set in the Lambda's own console config (not sensitive). `SUPABASE_SERVICE_ROLE_KEY` is deliberately **not** a Lambda env var (fetched from Secrets Manager).
- Vercel: Supabase vars synced via the Vercel–Supabase integration; `GEMINI_API_KEY` and the AWS photo-reader vars added manually.

---

## S3 bucket structure — housing photos

Bucket: `umd-bill-estimator-photos` (region `us-east-2`), public-read on objects only (anonymous `s3:GetObject`; no public listing or write). Two IAM users, each scoped to one job:
- `s3-photo-uploader` — `s3:PutObject` + `s3:GetObject` only; used locally (`aws s3 cp`). No delete permission on purpose.
- `app-photo-reader` — `s3:ListBucket` + `s3:GetObject` only; used server-side by the app.

A "folder" is just a shared key prefix; the filename after it is free-form. Layout:

```
housing/room-types/<slug>/<any filename>
housing/building-categories/<slug>/<any filename>
```

**Room type slugs** (8): `single`, `single-with-bath`, `double`, `double-with-bath`, `converted-single`, `double-requires-bunked-beds`, `triple-or-quad`, `triple-or-quad-with-bath` (DB value lowercased, spaces → hyphens).

**Building category slugs** (5 folders for 6 DB values): Traditional Without AC and Traditional With AC share `traditional`; New Traditional → `new-traditional`; Semi-Suite → `semi-suite`; Suite → `suite`; Apartment → `apartment`.

`getHousingImages()` (`src/lib/content/housingImages.ts`, cached 24h) lists all 13 folders and returns two `Record<dbValue, url[]>` maps; it fails soft to empty. Adding/replacing a photo needs no code change:
`aws s3 cp your-photo.jpg s3://umd-bill-estimator-photos/housing/room-types/<slug>/your-photo.jpg`

---

## Scraper pipeline (`scraper/`)

One `fetch*Page.ts` per UMD source → `writeToStaging.ts` → `promoteStaging.ts`. Staging review is mandatory; **promotion is manual by design, never automated.**

```
npm run scrape -- <academic_year_id>     # fetch UMD pages into *_staging
npm run promote -- <academic_year_id>    # copy reviewed staging into live tables (ALL rate tables)
npm run promote -- <academic_year_id> winter   # winter tables only
```
Both are idempotent (clear-before-write). `<academic_year_id>` is the UUID from `academic_years`. **Full `promote` delete-and-re-inserts every live rate table, which fails with a foreign-key error once any saved scenario references those rows** (`scenarios.tuition_rate_id` etc. have no cascade) — use `winter` for winter-only promotion; fixing full promote for an existing year is an open v2 backlog item. The winter promote also checks that the staged winter charts cover every credit count from 1 up to `academic_years.winter_max_credit_hours` before writing, and never touches that column.

Scrape source group 7 is the winter page (`exst.umd.edu/.../winter-session/tuition-and-fees`, `fetchWinterSessionPage.ts`): reads credit counts from the table headers, fails loudly if either table or fee row is missing or the 1..N credit chart is incomplete.

**New academic year rollover:** `npm run academic-year:create -- <label>` (not current) → `scrape` → review staging → `promote` → `npm run academic-year:activate -- <id>` (flips `is_current`, old year off first to respect the partial unique index).

### AWS Lambda automation (scrape-into-staging only)
- **Lambda:** `umd-bill-estimator-scraper`, Node.js 20.x, handler `scraper/lambdaHandler.handler`, timeout 2 min, 256 MB, no VPC. Real runs ≈ 9.5 s / 149 MB.
- **Build/deploy:** `tsconfig.lambda.json` defines the `@/*` → `src/*` path alias (the scraper imports constants from `src/lib/calculator`, which use it; without it the build fails). `npm run build:lambda` → zip `dist/lambda` with **forward-slash entry paths and no leading `./`** (e.g. a short Python `zipfile` script that writes `os.path.relpath(...).replace(os.sep, "/")`; Windows PowerShell 5.1 `Compress-Archive` writes backslash paths, which are fragile on Lambda's Linux side) → upload in the console (region us-east-2, function `umd-bill-estimator-scraper`).
- **Secret:** Secrets Manager `umd-bill-estimator/supabase-service-role-key` (us-east-2) holds `{ SUPABASE_SERVICE_ROLE_KEY }`. `lambdaHandler.ts` fetches it, sets `process.env`, then dynamically `import()`s `supabaseClient.ts`/`runScrape.ts` so module-level env reads happen after the secret lands. Only `lambdaHandler.ts` is bundled by `tsconfig.lambda.json`; the CLI scripts are untouched.
- **IAM:** `umd-bill-estimator-scraper-lambda-role` (trust: Lambda service; `AWSLambdaBasicExecutionRole` + inline `read-supabase-secret` scoped to that one secret ARN). EventBridge Scheduler's auto-generated role (trust: Scheduler; `lambda:InvokeFunction` scoped to this function).
- **Schedule:** EventBridge Scheduler `umd-bill-estimator-monthly-scrape`, `cron(0 6 1 * ? *)` (06:00 UTC on the 1st), targeting the Lambda directly.

---

## AI natural-language input (`src/lib/ai/`)

Chat UI (`ChatPanelContent.tsx` + desktop/mobile wrappers) parses free text into a `Selections` patch via function calling. Provider: Gemini `gemini-3.5-flash-lite`.

- **Provider seam:** `providers/types.ts` defines `AiProvider`; only `providers/gemini.ts` imports `@google/genai`. `getProvider.ts` picks the provider. Swapping to Claude = one new file + `getProvider.ts` change.
- **Core safety mechanism:** `calculator/verifyAiPatch.ts` builds the tool's JSON schema from the live `RatesBundle` (never hardcoded enums) and re-validates every returned field, including composite pairs like `{roomType, buildingCategory}`. The AI patch type is an allowlist of `Selections` fields; **`grants` is deliberately excluded** (the assistant redirects to the Aid & Grants tab).
- **Tools** (`tools/`): `setSelections`, `getHousingPhotos` (reuses `getHousingImages()`), `evaluateBudget` (1–3 labeled hypothetical patches merged onto the real current selections, run through real `validateSelections`/`calculateTotal`/`calculateNetTotal`; returns gross and net-of-aid totals and a budget comparison; never mutates state — the result card's "Apply this scenario" button is the only commit). **At most one tool call is handled per model turn** (known limitation).
- **Reply safety net:** `verifyReplyText.ts` — any dollar figure not matching a number a tool just computed (or one the student typed) replaces the whole reply with a deterministic templated sentence (`buildFallbackReply()` in `route.ts`); raw links/markdown images are always stripped.
- **Per-request context:** `describeSelections.ts` appends the student's current selections (sent from the client every request as `currentSelections`) and `describeCheapestDefaults()` (real cheapest housing row / resident dining plan) to the system prompt. The system prompt also encodes the housing/dining/parking business rules and a "full-plan request" behavior.
- **Rate limiting:** `ai_rate_limits` + the atomic `check_and_consume_ai_rate_limit` RPC, checked *before* the Gemini call. Guests are identified by a signed httpOnly cookie (`ai_guest_id`), signed-in users by `user_id`. Caps: guests 5/min & 20/day; signed-in 10/min & 60/day.
- **Logging:** `ai_parse_logs` (service-role only), disclosed in `/privacy`.
- **UI components:** `ChatConfirmationChips` (setSelections), `ChatPhotoPreview` + `ImageLightbox` (photos), `ChatBudgetComparison` (evaluateBudget; container-query responsive since it renders in a fixed-width panel).

---

## Testing
- Vitest, focused almost entirely on the pure calculator functions, `verifyAiPatch`, and `verifyReplyText`. No E2E/UI tests.
- `npm test` also picks up `.claude/worktrees/` checkouts if any exist, inflating the counts — remove worktrees (or ignore) before trusting the numbers.

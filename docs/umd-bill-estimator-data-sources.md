# Data Sources — UMD Bill Estimator

Every source URL found so far, organized by category. All pages confirmed server-rendered (data present in raw HTML) — plain `fetch` + Cheerio works for all of them, no headless browser needed.

---

## Tuition & Mandatory Fees

**https://billpay.umd.edu/UndergraduateTuition**
- Resident / non-resident tuition (per-credit and flat-rate)
- Differential tuition (Business/Engineering/CMSC juniors & seniors)
- Mandatory fee breakdown (tech, facilities, health, transportation, activities, athletics)
- Mandatory Student Health Insurance Plan (SHIP) rates
- Published per academic year (covers Fall + Spring together)

---

## Housing

**https://reslife.umd.edu/apply-housing/rates-terms**
- Housing rates by room type × building category (Traditional/Semi-Suite/Suite/Apartment)
- Summer housing rates (separate structure, by session)
- Prior year's rates also shown (useful for year-over-year diffing)

**https://reslife.umd.edu/apply-housing/rates-terms/2026-2027**
- Full terms & conditions (PDF linked from this page)
- Confirms housing rate = full academic year total, not per semester
- Housing application fee ($50, non-refundable)
- Cancellation/buyout fee schedules

**https://reslife.umd.edu/explore-halls/residence-halls**
- Hall community groupings (Cambridge, Denton, Ellicott, Heritage, Oakland, Leonardtown, North Hill, South Hill)
- Traditional/Semi-Suite/Apartment-Suite category breakdown by hall name
- Apartment vs. Suite definition (kitchen presence)

**https://reslife.umd.edu/explore-halls/at-glance**
- "Halls at a Glance" — most detailed per-hall table: category, AC status, laundry type, living-learning programs, break housing status
- Linked PDF: https://reslife.umd.edu/sites/default/files/2025-07/HallsAtAGlace-7-7-25.pdf

---

## Dining

**https://reslife.umd.edu/apply-housing/rates-terms/dining-plans**
- Overview page, links out to Dining Services

**https://dining.umd.edu/students/resident-plans**
- Actual resident dining plan pricing table (Base, Base Plus, Preferred, Premium)
- Dining Dollars and guest pass counts per tier
- Priced per semester (not annual, unlike housing)

---

## Parking

**https://transportation.umd.edu/parking/students/fees-and-permit-types**
- Permit types (Commuter, Resident, Overnight Storage) and 2026-2027 pricing (Annual/Fall/Spring/Summer)
- Bundle pack pricing ($75/10 one-day permits)
- Carpool discount details

**https://transportation.umd.edu/parking/students**
- Registration eligibility and lot assignment rules (not price-relevant, but useful context)

---

## Not Yet Fetched — Next Up

**https://orientation.umd.edu/paying-new-student-orientation**
- New Student Orientation fee amount — confirmed mandatory for new students, exact dollar figure still needed

---

## Notes for Claude Code Context

- All Drupal-based UMD sites so far (billpay, reslife, dining, transportation) render data server-side — a plain HTTP GET + Cheerio is sufficient for every source above.
- Treat all figures as "true as of last scrape" — most of these pages include some form of "rates subject to change without notice" language.
- Rate structures repeat a pattern: tuition/fees and housing are annual totals; dining and parking are typically per-term. Don't assume one billing cadence applies across categories.

# Parking Permits — Research & Business Rules Reference

Source: transportation.umd.edu/parking/students/fees-and-permit-types and /parking/students (2026-2027 rates)

---

## Permit Types

| Permit | Who It's For | Overnight Parking? |
|---|---|---|
| Commuter | Off-campus/commuter students | No — prohibited in commuter lots |
| Resident | On-campus residence hall students | Yes — 24/7 |
| Overnight Storage | Off-campus students (often near-campus apartments) who still want to store a car on campus overnight | Yes |

---

## 2026-2027 Pricing

| Term | Resident | Overnight Storage | Commuter |
|---|---|---|---|
| Annual | $750 | $955 | $387 |
| Fall Only | $452 | $573 | $233 |
| Spring Only | $452 | $573 | $233 |
| Summer Only | $452 | $573 | $233 |

**Pricing quirk to encode:** Fall + Spring bought separately costs more than Annual for every permit type (e.g. Commuter: $466 for two semesters vs. $387 Annual — a $79 difference). Worth surfacing as a savings tip in the calculator if a user selects both semesters.

---

## Other Purchase Options

- **Bundle pack** — $75 for 10 one-day permits, valid in Lots 4 or 6 only. Best fit for occasional commuters who don't need a full semester/annual permit. This is a fundamentally different pricing model (per-use, not per-term) — model it as its own option, not a variant of the Commuter permit.
- **Carpool discount** — 50% off a permit + a free bundle pack, when carpooling with another annual/semester permit holder. Possible stretch feature: a "carpool?" toggle that halves the relevant permit price.

---

## Rule: Permit type depends on residency status

Same pattern as the dining plan rule — the housing/living-situation choice constrains which parking options are even available.

| Living Situation | Eligible Permit Types |
|---|---|
| On-campus resident (in a hall) | Resident |
| Off-campus / commuter | Commuter, or Bundle Pack |
| Off-campus, near campus, wants overnight storage | Overnight Storage |

**In plain terms:** don't let a user pick "Resident permit" if they selected "commuter" for housing, or vice versa — cross-reference the housing/living-situation answer from earlier in the flow.

---

## Not Modeling For Now (Out of Scope for v1)

- Lot assignment by credit hours or residence hall community — affects *where* you park, not *how much* you pay. No price impact, so not needed for a cost estimator.
- Rolling registration dates by credit level — a "when can I sign up" detail, not a cost detail.
- Refund schedules — only relevant if you're modeling cancellations, which is out of scope for an estimator.
- Temporary medical permits — accommodation process, not a standard purchasing path.

# Housing & Dining Business Rules — Reference Sheet

A plain-language reference for the constraints your calculation engine needs to enforce. Keep this separate from the main checklist — this is "the rules," not "the tasks."

---

## Rule 1: Kitchen access determines dining plan requirement

This is the core constraint. Whether a student *must* have a dining plan depends entirely on whether their housing has a kitchen.

| Building Category | Has a Kitchen? | Dining Plan |
|---|---|---|
| Traditional (With/Without AC) | No | **Required** |
| New Traditional | No | **Required** |
| Semi-Suite | No | **Required** |
| Suite | No | **Required** |
| Apartment | Yes | **Optional** (can request exemption) |

**In plain terms:** if you live on campus and your room doesn't have a kitchen, you *must* carry a dining plan. If it does have a kitchen (Apartment category only), you can choose to skip it.

---

## Rule 2: What happens if a dining plan is required but not selected

If a student is in a non-kitchen hall and doesn't actively pick a plan, they're **automatically defaulted to the Base plan** — not left with no plan at all. Your calculator should reflect this default rather than allowing a "$0 dining" total for anyone in a non-kitchen hall.

---

## Rule 3: Apartment residents can opt out — but there's a window

Apartment residents *can* request release from a dining plan, but only within **14 days of moving in**. After that window, they're locked in for the semester. For a cost *estimator* (not a live enrollment tool), this mostly matters as a note/disclaimer — you're not enforcing a deadline, just modeling the two valid end-states: "Apartment + no plan" and "Apartment + plan."

---

## Rule 4: Moving from a kitchen unit into a non-kitchen unit

If a student moves from an Apartment into a Traditional/Semi-Suite/Suite hall mid-year, a dining plan becomes required at that point. Likely out of scope for v1 (that's a mid-year-change edge case), but worth a comment in your code if you ever touch this logic, so future-you knows it was considered and deliberately deferred.

---

## Rule 5: Housing term length defaults to the full academic year

The standard housing agreement binds a student to **both Fall and Spring semesters together** — not one semester at a time. Single-semester-only housing exists but requires special permission from Resident Life and isn't the default path. For your MVP, treat "housing" as an annual selection, not something a user picks independently per semester.

---

## Rule 6: Off-campus / commuter students

No housing selection → no dining plan requirement at all. This is your "escape hatch" baseline: commuter students skip Rules 1–5 entirely. Worth modeling explicitly as its own path (e.g., a `livingSituation: 'on-campus' | 'commuter'` flag) rather than trying to represent "no housing" as an empty/null housing selection, since null could also mean "user hasn't answered yet."

---

## Rule 7: Differential tuition is independent of residency status

Not a housing/dining rule, but easy to mix up: the Business/Engineering/Computer Science differential tuition applies to juniors and seniors in those majors **regardless of whether they're in-state or out-of-state**. It stacks on top of whichever base tuition rate applies — it doesn't replace or interact with the resident/non-resident distinction.

---

## Quick Decision Tree (for the calculation engine)

1. Is the student living on campus?
   - **No** → no housing cost, no dining plan requirement. Done.
   - **Yes** → continue.
2. What building category is their hall?
   - **Apartment** → dining plan optional (model both paths).
   - **Traditional / New Traditional / Semi-Suite / Suite** → dining plan required; if none selected, default to Base.
3. Housing cost = annual rate for (room type × building category) — same rate regardless of which specific hall, as long as the category matches.
4. Add dining plan cost (if applicable) — priced *per semester*, unlike housing which is annual.

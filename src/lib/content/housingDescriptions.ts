// Plain-language descriptions shown next to whichever housing option is
// currently selected -- what the room/building actually is, not what it
// costs (the breakdown already covers that). Keyed on the exact strings
// housing_rates.room_type / .building_category contain -- a mismatched key
// just means no description shows for that value, never a crash (see
// SelectionDetail's usage in HousingPanel).
//
// Room type text is user-provided (confirmed 2026-09-10). Building category
// text is UMD's own language, pulled directly from reslife.umd.edu's
// "Residence Halls" and "Room Layouts & Tours" pages (2026-09-10) --
// paraphrased close to source, not invented. New Traditional is the one
// exception: UMD's own site never describes it as a separate style anywhere
// (it only appears on the rate sheet) -- worded here as an inference
// (newer/renovated building, same Traditional layout), not a sourced fact.

export const ROOM_TYPE_DESCRIPTIONS: Record<string, string> = {
  Single: "A private bedroom for 1 student. You don't share your immediate bedroom space with anyone.",
  "Single With Bath": "A private bedroom for 1 student that features its own attached, private bathroom.",
  Double: "A shared bedroom for 2 students -- the most common room configuration on campus.",
  "Double With Bath":
    "A shared bedroom for 2 students that features an attached, private bathroom connected directly to the room.",
  "Converted Single":
    "A standard double-sized bedroom rented out to only 1 student -- significantly more square footage than a true Single, since the room was originally built to hold two people.",
  "Double Requires Bunked Beds":
    "A standard double room for 2 students that's physically smaller or configured in a way that requires the two beds to be bunked on top of each other to safely fit the required desks and wardrobes.",
  "Triple or Quad": "A shared bedroom for 3 or 4 students -- a larger room footprint to fit the extra beds and furniture.",
  "Triple or Quad With Bath": "A large, shared bedroom for 3 or 4 students that includes a private, attached bathroom.",
};

export const BUILDING_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Traditional Without AC":
    "Students typically live in double rooms and share communal bathrooms on each floor. Most Traditional-style buildings include a large multi-purpose room, kitchen, and laundry on the ground level, plus lounges on each floor. This building does not have air conditioning.",
  "Traditional With AC":
    "Same Traditional-style layout as Without AC -- double rooms, communal floor bathrooms, a ground-level multi-purpose room/kitchen/laundry, and floor lounges. This building has air conditioning.",
  "New Traditional":
    "Same Traditional-style layout (communal floor bathrooms, ground-level amenities) in a newer or more recently renovated building. UMD doesn't publicly describe this as its own separate room style -- it's the same Traditional experience, just a newer building.",
  "Semi-Suite":
    "One of two double rooms connected by a semi-private bathroom shared by all four students in both rooms -- more privacy than a communal floor bathroom, though not a fully private one. Buildings include a ground-level kitchen, study lounges, and laundry.",
  Suite: "3-5 bedrooms sharing a common bathroom with only your roommates -- like an Apartment, but without the kitchen and dining room.",
  Apartment:
    "3-5 bedrooms (usually housing up to 8 students) with a fully equipped kitchen, furnished living/dining room, and at least one bathroom -- the only building category with a kitchen, so a dining plan isn't required if you live here.",
};

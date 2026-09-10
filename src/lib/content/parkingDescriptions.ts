// Plain-language description shown next to whichever permit type is
// currently selected. Keyed on the exact permit_type strings parking_permits
// contains -- a mismatched key just means no description shows, never a
// crash (see SelectionDetail's usage in ParkingPanel). Sourced from
// docs/PARKING-RULES.md's own research (transportation.umd.edu).
export const PERMIT_TYPE_DESCRIPTIONS: Record<string, string> = {
  Commuter:
    "For off-campus/commuter students. Overnight parking isn't allowed in commuter lots -- this is for daytime parking while you're on campus.",
  Resident: "For students living in an on-campus residence hall. Allows 24/7 parking, including overnight.",
  "Overnight Storage":
    "For off-campus students (often in near-campus apartments) who still want to store a car on campus overnight -- unlike a Commuter permit, overnight parking is allowed.",
};

import type { AiSelectionsPatch } from "@/lib/calculator/verifyAiPatch";

// Turns a setSelections patch into short, human-readable field/value pairs
// for the confirmation chips -- one line of formatting logic per field,
// deliberately not a generic Object.entries loop, since raw field names
// ("livingSituation") and enum values ("on_campus") aren't fit to show a
// student directly.
export function describeSelectionsPatch(patch: AiSelectionsPatch): { field: string; value: string }[] {
  const entries: { field: string; value: string }[] = [];

  if (patch.semester !== undefined) {
    entries.push({ field: "Semester", value: patch.semester === "fall" ? "Fall" : "Spring" });
  }
  if (patch.educationLevel !== undefined) {
    entries.push({
      field: "Education Level",
      value: patch.educationLevel === "graduate" ? "Graduate" : "Undergraduate",
    });
  }
  if (patch.residency !== undefined) {
    entries.push({
      field: "Residency",
      value: patch.residency === "resident" ? "Maryland Resident" : "Non-Resident",
    });
  }
  if (patch.creditHours !== undefined) {
    entries.push({ field: "Credit Hours", value: String(patch.creditHours) });
  }
  if (patch.appliesDifferentialTuition !== undefined) {
    entries.push({ field: "Differential Tuition", value: patch.appliesDifferentialTuition ? "Yes" : "No" });
  }
  if (patch.insurance !== undefined) {
    entries.push({ field: "Health Insurance", value: patch.insurance ? "Yes" : "No" });
  }
  if (patch.livingSituation !== undefined) {
    entries.push({
      field: "Living Situation",
      value: patch.livingSituation === "on_campus" ? "On-Campus" : "Commuter",
    });
  }
  // Truthy checks, not `!== undefined` -- these fields are typed nullable
  // (inherited from Selections, where null means "explicitly cleared"), but
  // verifyAiPatch never actually produces null for them, only a real object
  // or leaves the field unset entirely. The truthy check both satisfies
  // TypeScript's narrowing and matches that real behavior.
  if (patch.housing) {
    entries.push({ field: "Housing", value: `${patch.housing.roomType}, ${patch.housing.buildingCategory}` });
  }
  if (patch.residentDiningPlan) {
    entries.push({ field: "Dining Plan", value: patch.residentDiningPlan.planName });
  }
  if (patch.blockDiningPlan) {
    entries.push({ field: "Dining Plan", value: `${patch.blockDiningPlan.planLabel} (Block)` });
  }
  if (patch.parking) {
    entries.push({ field: "Parking", value: `${patch.parking.permitType} (${patch.parking.term})` });
  }

  return entries;
}

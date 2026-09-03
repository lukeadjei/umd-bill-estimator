import type { Selections } from "@/lib/calculator/types";

// The dashboard's single source of truth, lifted up into DashboardShell.
// This is the REAL Selections type from the calc engine (src/lib/calculator/types.ts)
// -- not a parallel shape that could drift out of sync with it -- plus the one
// field it deliberately doesn't cover: `major` is a real column on the
// `scenarios` table, just not something calculateTotal/validateSelections need.
export type DashboardSelections = Selections & { major: string };

// Every panel's starting point. Housing/resident-dining default to non-null
// so the on-campus fields have something sensible to show immediately --
// HousingPanel nulls `housing` out itself when the user picks "commuter".
export const DEFAULT_SELECTIONS: DashboardSelections = {
  major: "",
  semester: "fall",
  educationLevel: "undergraduate",
  residency: "resident",
  creditHours: 12,
  appliesDifferentialTuition: false,
  insurance: false,
  livingSituation: "on_campus",
  housing: { roomType: "double", buildingCategory: "traditional" },
  residentDiningPlan: { planName: "base" },
  blockDiningPlan: null,
  parking: null,
};

// Every tab panel gets the same three props: the full selections object (a
// panel only reads its own slice of it, but passing the whole thing keeps
// this type -- and every panel's signature -- from having to change every
// time a field is added), a patch-style updater, and the spacious flag for
// font sizing when the chat panel is collapsed.
export type PanelProps = {
  selections: DashboardSelections;
  onChange: (patch: Partial<DashboardSelections>) => void;
  spacious: boolean;
};

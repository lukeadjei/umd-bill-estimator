import type { RatesBundle, Selections } from "@/lib/calculator/types";

// The dashboard's single source of truth, lifted up into DashboardShell.
// This is the REAL Selections type from the calc engine (src/lib/calculator/types.ts)
// -- not a parallel shape that could drift out of sync with it -- plus the one
// field it deliberately doesn't cover: `major` is a real column on the
// `scenarios` table, just not something calculateTotal/validateSelections need.
export type DashboardSelections = Selections & { major: string };

// Every panel's starting point -- nothing pre-selected. A first-time visitor
// (or a fresh page load) should see a $0 total and no validation errors
// about combinations they never actually chose, not a bill silently
// computed against defaults picked on their behalf. calculateTotal prices
// every null field here as $0; validateSelections reports the required ones
// as "not answered yet" rather than guessing.
export const DEFAULT_SELECTIONS: DashboardSelections = {
  major: "",
  semester: "fall",
  educationLevel: null,
  residency: null,
  creditHours: null,
  appliesDifferentialTuition: false,
  insurance: false,
  livingSituation: null,
  housing: null,
  residentDiningPlan: null,
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
  rates: RatesBundle;
};

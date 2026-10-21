import type { Semester } from "@/lib/calculator/types";

export type TabId = "major" | "tuition" | "housing" | "parking" | "meals" | "aid";

export type TabItem = { id: TabId; label: string };

// Master list, in display order.
export const TAB_ITEMS: TabItem[] = [
  { id: "major", label: "Major" },
  { id: "tuition", label: "Tuition" },
  { id: "housing", label: "Housing" },
  { id: "parking", label: "Parking" },
  { id: "meals", label: "Meals" },
  { id: "aid", label: "Aid & Grants" },
];

const ALL_TABS: readonly TabId[] = TAB_ITEMS.map((tab) => tab.id);

// Which tabs each semester shows. A Record<Semester, ...> so a new semester is a compile
// error until it says what it shows (same pattern as SEMESTER_CONFIG). Winter has no major
// (only differential tuition uses it), housing, parking or meals -- just tuition and aid.
export const SEMESTER_TABS: Record<Semester, readonly TabId[]> = {
  fall: ALL_TABS,
  spring: ALL_TABS,
  winter: ["tuition", "aid"],
};

// The tabs for a semester, in master-list order. The nav bar, the step pill, the
// Back/Next buttons and the Progress card all read this one list.
export function getTabItems(semester: Semester): TabItem[] {
  return TAB_ITEMS.filter((tab) => SEMESTER_TABS[semester].includes(tab.id));
}

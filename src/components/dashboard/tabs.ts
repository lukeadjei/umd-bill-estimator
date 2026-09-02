export type TabId = "major" | "tuition" | "housing" | "parking" | "meals";

export const TAB_ITEMS: { id: TabId; label: string }[] = [
  { id: "major", label: "Major" },
  { id: "tuition", label: "Tuition" },
  { id: "housing", label: "Housing" },
  { id: "parking", label: "Parking" },
  { id: "meals", label: "Meals" },
];

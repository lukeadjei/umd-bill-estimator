export type CategoryId = "account" | "scenarios";

export const CATEGORY_ITEMS: { id: CategoryId; label: string }[] = [
  { id: "account", label: "Account" },
  { id: "scenarios", label: "Saved Scenarios" },
];

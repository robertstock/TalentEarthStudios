export const PROJECT_COST_CATEGORIES = [
  { value: "OUTSIDE_PRINTING", label: "Outside printing" },
  { value: "COURIER_FREIGHT", label: "Courier / delivery / freight" },
  { value: "MATERIALS", label: "Materials" },
  { value: "OUTSIDE_LABOR", label: "Outside labor" },
  { value: "EQUIPMENT_RENTAL", label: "Equipment rental" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OTHER", label: "Other / custom" },
] as const;

export type ProjectCostCategory = (typeof PROJECT_COST_CATEGORIES)[number]["value"];

export function isProjectCostCategory(value: unknown): value is ProjectCostCategory {
  return PROJECT_COST_CATEGORIES.some((category) => category.value === value);
}

export function getProjectCostCategoryLabel(value: string) {
  return PROJECT_COST_CATEGORIES.find((category) => category.value === value)?.label ?? "Other / custom";
}

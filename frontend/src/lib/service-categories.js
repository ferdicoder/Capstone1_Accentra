export const CATEGORY_META = {
  tax_filing:           { label: "Tax Filing",            description: "" },
  business_registration: { label: "Business Registration", description: "" },
  other:                 { label: "Other",                 description: "" },
}

export const normalizeServiceCategory = (category) => {
  if (typeof category !== "string") return ""

  const normalized = category.trim().toLowerCase().replace(/[\s-]+/g, "_")
  if (normalized === "taxfiling") return "tax_filing"
  if (normalized === "business_registration") return "business_registration"
  return normalized
}

export const getCategoryLabel = (category) =>
  CATEGORY_META[normalizeServiceCategory(category)]?.label ?? category ?? "—"

export const SERVICE_CATEGORIES = Object.keys(CATEGORY_META)
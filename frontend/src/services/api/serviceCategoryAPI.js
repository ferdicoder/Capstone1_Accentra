import { supabase } from "@/config/supabase"

function mapServiceCategoryRow(row) {
  return {
    value: row.category,
    label: row.name,
    description: row.description ?? "",
  }
}

async function getServiceCategories() {
  const { data, error } = await supabase
    .from("service_categories")
    .select("category, name, description")
    .eq("is_active", true)
    .order("name")

  if (error) throw error
  return (data ?? []).map(mapServiceCategoryRow)
}

export { getServiceCategories }

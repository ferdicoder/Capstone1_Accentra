import { supabase } from "@/config/supabase"

function mapBusinessRow(row) {
  return {
    id: row.business_id,
    ownerId: row.owner_id,
    name: row.name ?? "",
    businessType: row.business_type ?? "",
    tinNo: row.tin_no ?? "",
    industry: row.industry ?? "",
    contactNo: row.contact_no ?? "",
    address: [row.house_no, row.street, row.barangay, row.district, row.city, row.zip_code]
      .filter(Boolean)
      .join(", "),
  }
}

const BUSINESS_SELECT = `
  business_id, owner_id, name, business_type, tin_no, industry, contact_no,
  house_no, street, barangay, district, city, zip_code
`

// One business per client — owner_id is UNIQUE, so .single() is safe here.
export async function getMyBusiness(userId) {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("owner_id", userId)
    .single()
  if (error) throw error

  return mapBusinessRow(data)
}
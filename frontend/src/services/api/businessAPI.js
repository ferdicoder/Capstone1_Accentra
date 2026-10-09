import { supabase } from "@/config/supabase"

function mapBusinessRow(row) {
  const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner

  return {
    id: row.business_id,
    ownerId: row.owner_id,
    firstName: owner?.first_name ?? "",
    middleName: owner?.middle_name ?? "",
    lastName: owner?.last_name ?? "",
    email: owner?.email ?? "",
    ownerStatus: owner?.status ?? "inactive",
    name: row.name ?? "",
    businessName: row.name ?? "",
    businessType: row.business_type ?? "",
    clientType: row.type === "retainer" ? "retainer" : "non_retainer",
    tinNo: row.tin_no ?? "",
    tin: row.tin_no ?? "",
    industry: row.industry ?? "",
    contactNo: row.contact_no ?? "",
    contactNumber: row.contact_no ?? "",
    houseNo: row.house_no ?? "",
    streetName: row.street ?? "",
    barangay: row.barangay ?? "",
    district: row.district ?? "",
    city: row.city ?? "",
    zipCode: row.zip_code ?? "",
    address: [row.house_no, row.street, row.barangay, row.district, row.city, row.zip_code]
      .filter(Boolean)
      .join(", "),
  }
}

const BUSINESS_SELECT = `
  business_id, owner_id, name, business_type, tin_no, industry, contact_no,
  house_no, street, barangay, district, city, zip_code
`

const FIRM_BUSINESS_SELECT = `
  business_id, owner_id, name, business_type, type, tin_no, industry, contact_no,
  house_no, street, barangay, district, city, zip_code,
  owner:users(user_id, first_name, middle_name, last_name, email, contact_no, status)
`

export async function getBusinesses() {
  const { data, error } = await supabase
    .from("businesses")
    .select(FIRM_BUSINESS_SELECT)
    .order("name")
  if (error) throw error

  return (data ?? []).map(mapBusinessRow)
}

const CLIENT_SEARCH_SELECT = `
  business_id, owner_id, name, business_type, tin_no, industry, contact_no,
  house_no, street, barangay, district, city, zip_code,
  owner:users(user_id, first_name, middle_name, last_name, email, contact_no, status)
`

function escapeIlike(value) {
  return value.replace(/[\\%_]/g, "\\$&")
}

export async function searchClients(query, limit = 10) {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return []

  const pattern = `%${escapeIlike(normalizedQuery)}%`
  const userSearch = supabase
    .from("users")
    .select("user_id")
    .or(`first_name.ilike.${pattern},middle_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern},contact_no.ilike.${pattern}`)
    .limit(limit)
  const businessSearch = supabase
    .from("businesses")
    .select(CLIENT_SEARCH_SELECT)
    .ilike("name", pattern)
    .order("name")
    .limit(limit)

  const [{ data: users, error: usersError }, { data: businesses, error: businessesError }] =
    await Promise.all([userSearch, businessSearch])
  if (usersError) throw usersError
  if (businessesError) throw businessesError

  const matchingOwnerIds = (users ?? []).map((user) => user.user_id)
  let rows = businesses ?? []
  if (matchingOwnerIds.length > 0) {
    const { data: ownerBusinesses, error } = await supabase
      .from("businesses")
      .select(CLIENT_SEARCH_SELECT)
      .in("owner_id", matchingOwnerIds)
      .order("name")
      .limit(limit)
    if (error) throw error
    rows = [...rows, ...(ownerBusinesses ?? [])]
  }

  return rows
    .filter((row, index, allRows) =>
      allRows.findIndex((candidate) => candidate.business_id === row.business_id) === index
    )
    .slice(0, limit)
    .map(mapBusinessRow)
}

export async function updateBusinessType({ businessId, clientType }) {
  const { data, error } = await supabase
    .from("businesses")
    .update({ type: clientType === "retainer" ? "retainer" : "non-retainer" })
    .eq("business_id", businessId)
    .select(FIRM_BUSINESS_SELECT)
    .single()
  if (error) throw error

  return mapBusinessRow(data)
}

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

export async function updateMyBusiness({ businessId, ...business }) {
  const { data, error } = await supabase
    .from("businesses")
    .update({
      name: business.businessName,
      business_type: business.businessType,
      tin_no: business.tin,
      industry: business.industry,
      contact_no: business.contactNumber,
      house_no: business.houseNo,
      street: business.streetName,
      barangay: business.barangay,
      district: business.district,
      city: business.city,
      zip_code: business.zipCode,
    })
    .eq("business_id", businessId)
    .select(BUSINESS_SELECT)
    .single()

  if (error) throw error

  return mapBusinessRow(data)
}
import { supabase } from "@/config/supabase"

function mapBusinessRow(row) {
  const owner = Array.isArray(row.owner) ? row.owner[0] : row.owner

  return {
    id: row.business_id,
    ownerId: row.owner_id,
    hasBusiness: true,
    firstName: owner?.first_name ?? "",
    middleName: owner?.middle_name ?? "",
    lastName: owner?.last_name ?? "",
    email: owner?.email ?? "",
    ownerStatus: owner?.status ?? "inactive",
    name: row.name ?? "",
    businessName: row.name ?? "",
    businessType: row.business_type ?? "",
    // Raw stored classification: 'retainer' | 'non-retainer' | null
    // (null only on legacy rows created before signups always set
    // 'non-retainer'; the firm classifies them via Edit Client).
    type: row.type ?? null,
    clientType: row.type === "retainer" ? "retainer" : "non_retainer",
    retainerFee: row.retainer_fee != null ? Number(row.retainer_fee) : null,
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
  business_id, owner_id, name, business_type, type, tin_no, industry, contact_no,
  house_no, street, barangay, district, city, zip_code
`

const FIRM_BUSINESS_SELECT = `
  business_id, owner_id, name, business_type, type, retainer_fee, tin_no, industry, contact_no,
  house_no, street, barangay, district, city, zip_code,
  owner:users(user_id, first_name, middle_name, last_name, email, contact_no, status)
`

// Synthetic row for a client who signed up without a business: the client
// exists in users + user_roles but has no businesses row. `id` is the owner's
// user id — a uuid that can never collide with a real business_id, so every
// business_id-keyed lookup (engagements, billings) safely matches nothing.
function mapBusinesslessClientRow(user) {
  return {
    id: user.user_id,
    ownerId: user.user_id,
    hasBusiness: false,
    firstName: user.first_name ?? "",
    middleName: user.middle_name ?? "",
    lastName: user.last_name ?? "",
    email: user.email ?? "",
    ownerStatus: user.status ?? "inactive",
    name: "",
    businessName: "",
    businessType: "",
    type: null,
    clientType: "non_retainer",
    retainerFee: null,
    tinNo: "",
    tin: "",
    industry: "",
    contactNo: user.contact_no ?? "",
    contactNumber: user.contact_no ?? "",
    houseNo: "",
    streetName: "",
    barangay: "",
    district: "",
    city: "",
    zipCode: "",
    address: "",
  }
}

// All firm-visible clients: businesses rows plus client-role users who have
// no business yet (appended after the name-sorted business rows).
export async function getBusinesses() {
  const [{ data: businessRows, error: businessError }, { data: clientUsers, error: usersError }] =
    await Promise.all([
      supabase.from("businesses").select(FIRM_BUSINESS_SELECT).order("name"),
      supabase
        .from("users")
        .select(
          "user_id, first_name, middle_name, last_name, email, contact_no, status, user_roles!inner(role)"
        )
        .eq("user_roles.role", "client"),
    ])
  if (businessError) throw businessError
  if (usersError) throw usersError

  const mappedBusinesses = (businessRows ?? []).map(mapBusinessRow)
  const ownersWithBusiness = new Set((businessRows ?? []).map((row) => row.owner_id))
  const businesslessClients = (clientUsers ?? [])
    .filter((user) => !ownersWithBusiness.has(user.user_id))
    .map(mapBusinesslessClientRow)

  return [...mappedBusinesses, ...businesslessClients]
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

export async function updateBusinessType({ businessId, clientType, retainerFee }) {
  const isRetainer = clientType === "retainer"
  const { data, error } = await supabase
    .from("businesses")
    .update({
      type: isRetainer ? "retainer" : "non-retainer",
      retainer_fee: isRetainer ? retainerFee ?? null : null,
    })
    .eq("business_id", businessId)
    .select(FIRM_BUSINESS_SELECT)
    .single()
  if (error) throw error

  return mapBusinessRow(data)
}

// One business per client — owner_id is UNIQUE. maybeSingle: clients who
// signed up without a business legitimately have no row (null, not an error).
export async function getMyBusiness(userId) {
  const { data, error } = await supabase
    .from("businesses")
    .select(BUSINESS_SELECT)
    .eq("owner_id", userId)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  return mapBusinessRow(data)
}

export async function createMyBusiness({ userId, ...business }) {
  if (!userId) {
    throw new Error("A signed-in user is required to create a business.")
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert({
      owner_id: userId,
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
    .select(BUSINESS_SELECT)
    .single()

  if (error) throw error

  return mapBusinessRow(data)
}

export async function updateMyBusiness({ userId, businessId, ...business }) {
  if (!userId || !businessId) {
    throw new Error("A signed-in user and business are required to update a business.")
  }

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
    .eq("owner_id", userId)
    .select(BUSINESS_SELECT)
    .single()

  if (error) throw error

  return mapBusinessRow(data)
}
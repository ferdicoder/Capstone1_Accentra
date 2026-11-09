import { supabase } from "@/config/supabase"

// NOTE: requires a middle_name column on public.users.
const PROFILE_SELECT = "user_id, first_name, middle_name, last_name, email, contact_no"

function mapProfileRow(row) {
  if (!row) return null
  return {
    id: row.user_id,
    firstName: row.first_name ?? "",
    middleName: row.middle_name ?? "",
    lastName: row.last_name ?? "",
    email: row.email ?? "",
    contactNumber: row.contact_no ?? "",
  }
}

// Reads the signed-in user's own row from public.users.
export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) throw error
  return mapProfileRow(data)
}

// Self-edit only: name and contact number. Email and role are not touched here.
// .single() makes a blocked update (missing RLS policy) throw instead of
// silently returning nothing.
// middleName is optional so the Admin page (which has no middle name field)
// keeps working: when it is undefined the column is left untouched.
export async function updateMyProfile({
  userId,
  firstName,
  middleName,
  lastName,
  contactNumber,
}) {
  const changes = {
    first_name: firstName,
    last_name: lastName,
    contact_no: contactNumber || null,
  }
  if (middleName !== undefined) changes.middle_name = middleName || null

  const { data, error } = await supabase
    .from("users")
    .update(changes)
    .eq("user_id", userId)
    .select(PROFILE_SELECT)
    .single()

  if (error) throw error
  return mapProfileRow(data)
}
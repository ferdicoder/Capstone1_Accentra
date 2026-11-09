import { supabase } from "@/config/supabase"

const PROFILE_SELECT = "user_id, first_name, last_name, email, contact_no"

function mapProfileRow(row) {
  if (!row) return null
  return {
    id: row.user_id,
    firstName: row.first_name ?? "",
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
export async function updateMyProfile({ userId, firstName, lastName, contactNumber }) {
  const { data, error } = await supabase
    .from("users")
    .update({
      first_name: firstName,
      last_name: lastName,
      contact_no: contactNumber || null,
    })
    .eq("user_id", userId)
    .select(PROFILE_SELECT)
    .single()

  if (error) throw error
  return mapProfileRow(data)
}
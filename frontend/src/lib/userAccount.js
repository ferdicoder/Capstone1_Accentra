import { supabase } from "@/config/supabase"

// True when an account already uses this email address.
export async function isEmailAlreadyRegistered(email) {
  const value = (email ?? "").trim()
  if (!value) return false

  const { data, error } = await supabase
    .from("users")
    .select("user_id")
    .eq("email", value)
    .limit(1)

  if (error) {
    console.error("Could not check for an existing account:", error.message)
    return false
  }

  return (data ?? []).length > 0
}

// Reads the account status of a user, e.g. "active", "inactive", "deactivated".
export async function getAccountStatus(userId) {
  if (!userId) return null

  const { data, error } = await supabase
    .from("users")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("Could not read the account status:", error.message)
    return null
  }

  return data?.status ?? null
}

// Reads the account status of an email address, before signing in.
export async function getAccountStatusByEmail(email) {
  const value = (email ?? "").trim()
  if (!value) return null

  const { data, error } = await supabase
    .from("users")
    .select("status")
    .eq("email", value)
    .maybeSingle()

  if (error) {
    console.error("Could not read the account status:", error.message)
    return null
  }

  return data?.status ?? null
}

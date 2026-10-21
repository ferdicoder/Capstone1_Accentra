import { supabase } from "@/config/supabase"

// The users table keeps the birthday in a "birthdate" column.
const BIRTHDAY_COLUMN = "birthdate"

// Reads the birthday of each user. Returns {} when the column is unavailable.
export async function fetchUserBirthdays(userIds) {
  const ids = (userIds ?? []).filter(Boolean)
  if (!ids.length) return {}

  const { data, error } = await supabase
    .from("users")
    .select(`user_id, ${BIRTHDAY_COLUMN}`)
    .in("user_id", ids)

  if (error) {
    console.error("Could not read birthdays:", error.message)
    return {}
  }

  return Object.fromEntries(
    (data ?? []).map((row) => [row.user_id, row[BIRTHDAY_COLUMN] ?? ""])
  )
}

// Saves one user's birthday. Pass an empty value to clear it.
export async function saveUserBirthday({ userId, birthdate }) {
  const { error } = await supabase
    .from("users")
    .update({ [BIRTHDAY_COLUMN]: birthdate || null })
    .eq("user_id", userId)

  if (error) throw error
}

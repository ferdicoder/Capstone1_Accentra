import { supabase } from "@/config/supabase"

export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from("notifications")
    .select("notif_id, type, title, description, entity_type, entity_id, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30)

  if (error) throw error
  return data ?? []
}

export async function markNotificationRead(notifId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("notif_id", notifId)

  if (error) throw error
}

export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null)

  if (error) throw error
}

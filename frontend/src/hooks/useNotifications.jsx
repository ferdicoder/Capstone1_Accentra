import { useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { queryKeys } from "@/config/queryKeys"
import { supabase } from "@/config/supabase"
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/api/notificationAPI"

export function useNotifications(userId) {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: () => getNotifications(userId),
    enabled: Boolean(userId),
    refetchInterval: 30_000,
  })

  useEffect(() => {
    if (!userId) return undefined

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) })
        }
      )
      .subscribe((status, error) => {
        if ((status === "CHANNEL_ERROR" || status === "TIMED_OUT") && error) {
          console.error("Notification realtime subscription failed:", error)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, userId])

  return query
}

export function useMarkNotificationRead(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) })
    },
  })
}

export function useMarkAllNotificationsRead(userId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) })
    },
  })
}

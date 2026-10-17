import { useMemo, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications"
import { authStore } from "@/store/authStore"

function formatNotificationDate(value) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getNotificationPath(notification, role) {
  if (!notification.entity_id) return null

  switch (notification.entity_type) {
    case "engagement":
      return `/${role === "staff" ? "firm" : "client"}/engagements/${notification.entity_id}`
    case "payment":
      return role === "staff"
        ? `/billing-officer/billing/${notification.entity_id}`
        : `/client/billing/${notification.entity_id}`
    case "service_request":
      return `/${role === "staff" ? "firm" : "client"}/service-requests`
    default:
      return null
  }
}

export function ClientNotifications({ role = "client" }) {
  const navigate = useNavigate()
  const userId = authStore((state) => state.user?.id)
  const [actionError, setActionError] = useState("")
  const { data: notifications = [], isLoading, error } = useNotifications(userId)
  const markRead = useMarkNotificationRead(userId)
  const markAllRead = useMarkAllNotificationsRead(userId)

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read_at).length,
    [notifications]
  )

  const handleNotificationClick = async (notification) => {
    setActionError("")
    try {
      if (!notification.read_at) {
        await markRead.mutateAsync(notification.notif_id)
      }
    } catch {
      setActionError("Notification could not be marked as read. Please try again.")
      return
    }

    const path = getNotificationPath(notification, role)
    if (path) navigate(path)
  }

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="relative size-10"
            aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
          />
        }
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-emerald-500" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <PopoverHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <PopoverTitle>Notifications</PopoverTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={async () => {
                setActionError("")
                try {
                  await markAllRead.mutateAsync()
                } catch {
                  setActionError("Notifications could not be marked as read. Please try again.")
                }
              }}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </Button>
          )}
        </PopoverHeader>
        {actionError && (
          <p className="border-b px-4 py-2 text-xs text-destructive">{actionError}</p>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading notifications...
          </div>
        )}
        {error && (
          <p className="p-6 text-sm text-destructive">
            Notifications could not be loaded. Please try again.
          </p>
        )}
        {!isLoading && !error && notifications.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        )}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.notif_id}
                type="button"
                className="flex w-full flex-col gap-1 border-b px-4 py-3 text-left last:border-b-0 hover:bg-muted/60"
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="flex items-start gap-2">
                  <span
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      notification.read_at ? "bg-transparent" : "bg-emerald-500"
                    }`}
                  />
                  <span className="font-medium">{notification.title}</span>
                </span>
                {notification.description && (
                  <span className="pl-4 text-sm text-muted-foreground">
                    {notification.description}
                  </span>
                )}
                <span className="pl-4 text-xs text-muted-foreground">
                  {formatNotificationDate(notification.created_at)}
                </span>
              </button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

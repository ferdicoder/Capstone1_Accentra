import { useEffect, useMemo, useRef, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

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

const EMPTY_NOTIFICATIONS = []

function formatNotificationDate(value) {
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function getClientNotificationPath(notification) {
  switch (notification.entity_type) {
    case "engagement":
      return `/client/engagements/${notification.entity_id}`
    case "payment":
      return `/client/billing/${notification.entity_id}`
    case "service_request":
      return "/client/service-requests"
    default:
      return null
  }
}

function getStaffNotificationPath(notification) {
  switch (notification.entity_type) {
    case "engagement":
      return `/firm/engagements/${notification.entity_id}`
    case "service":
      return "/firm/services"
    default:
      return null
  }
}

function getAdminNotificationPath(notification) {
  switch (notification.entity_type) {
    case "engagement":
      return `/admin/engagements/${notification.entity_id}`
    case "payment":
      return `/admin/billing/${notification.entity_id}`
    case "service_request":
      return "/admin/service-requests"
    case "service":
      return "/admin/services"
    default:
      return null
  }
}

function getBillingOfficerNotificationPath(notification) {
  switch (notification.entity_type) {
    case "engagement":
      return `/billing-officer/engagements/${notification.entity_id}`
    case "payment":
      return `/billing-officer/billing/${notification.entity_id}`
    default:
      return null
  }
}

function getNotificationPath(notification, role) {
  if (!notification.entity_id) return null

  const pathByRole = {
    client: getClientNotificationPath,
    staff: getStaffNotificationPath,
    admin: getAdminNotificationPath,
    billing_officer: getBillingOfficerNotificationPath,
  }

  return pathByRole[role]?.(notification) ?? null
}

const notificationLabels = new Map([
  ["payment_verified", "Payment verified"],
  ["payment_rejected", "Payment rejected"],
  ["payment_refunded", "Payment refunded"],
  ["service_request_submitted", "New service request"],
  ["service_request_approved", "Service request approved"],
  ["service_request_rejected", "Service request rejected"],
  ["engagement_assigned", "Engagement assigned"],
  ["engagement_ready_for_billing", "Engagement ready for billing"],
  ["service_created", "New service available"],
  ["client_registered", "New client registered"],
])

const navigationKeysByRole = {
  client: {
    service_request: "serviceRequests",
    engagement: "engagements",
    payment: "billing",
  },
  staff: {
    engagement: "engagements",
    service: "services",
  },
  admin: {
    service_request: "serviceRequests",
    payment: "billing",
    engagement: "engagements",
    service: "services",
    client: "clients",
  },
  billing_officer: {
    engagement: "engagements",
    payment: "billing",
  },
}

const navigationPathsByRole = {
  client: {
    serviceRequests: "/client/service-requests",
    engagements: "/client/engagements",
    billing: "/client/billing",
  },
  staff: {
    engagements: "/firm/engagements",
    services: "/firm/services",
  },
  admin: {
    serviceRequests: "/admin/service-requests",
    services: "/admin/services",
    engagements: "/admin/engagements",
    billing: "/admin/billing",
    clients: "/admin/clients",
  },
  billing_officer: {
    engagements: "/billing-officer/engagements",
    billing: "/billing-officer/billing",
  },
}

function getNotificationLabel(notification) {
  const entity = notification?.entity_type
  if (!["service_request", "payment", "engagement", "service", "client"].includes(entity)) return null

  return notificationLabels.get(notification?.type) ?? null
}

export function ClientNotifications({ role = "client", onUnreadCountsChange }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const userId = authStore((state) => state.user?.id)
  const [actionError, setActionError] = useState("")
  const { data: notifications = EMPTY_NOTIFICATIONS, isLoading, error } = useNotifications(userId)
  const markRead = useMarkNotificationRead(userId)
  const markAllRead = useMarkAllNotificationsRead(userId)
  const attemptedReadIds = useRef(new Set())
  const visibleNotifications = useMemo(
    () =>
      role === "staff"
        ? notifications.filter((notification) => notification.type !== "service_request_submitted")
        : notifications,
    [notifications, role]
  )

  const unreadCount = useMemo(
    () => visibleNotifications.filter((notification) => !notification.read_at).length,
    [visibleNotifications]
  )
  const unreadNavigationCounts = useMemo(() => {
    const roleKeys = navigationKeysByRole[role] ?? {}
    return visibleNotifications.reduce((counts, notification) => {
      if (notification.read_at) return counts
      const navigationKey = roleKeys[notification.entity_type]
      if (navigationKey) {
        counts[navigationKey] = (counts[navigationKey] ?? 0) + 1
      }
      return counts
    }, {})
  }, [role, visibleNotifications])

  useEffect(() => {
    onUnreadCountsChange?.(unreadNavigationCounts)
  }, [onUnreadCountsChange, unreadNavigationCounts])

  useEffect(() => {
    const roleKeys = navigationKeysByRole[role] ?? {}
    const rolePaths = navigationPathsByRole[role] ?? {}
    const activeEntityTypes = Object.entries(roleKeys)
      .filter(([, navigationKey]) => {
        const path = rolePaths[navigationKey]
        return path && (pathname === path || pathname.startsWith(`${path}/`))
      })
      .map(([entityType]) => entityType)

    if (activeEntityTypes.length === 0) return

    const unreadToMark = visibleNotifications.filter(
      (notification) =>
        !notification.read_at &&
        activeEntityTypes.includes(notification.entity_type) &&
        !attemptedReadIds.current.has(notification.notif_id)
    )
    if (unreadToMark.length === 0) return

    let cancelled = false
    unreadToMark.forEach((notification) =>
      attemptedReadIds.current.add(notification.notif_id)
    )
    const markViewedNotificationsRead = async () => {
      for (const notification of unreadToMark) {
        try {
          await markRead.mutateAsync(notification.notif_id)
        } catch (error) {
          attemptedReadIds.current.delete(notification.notif_id)
          console.error("Viewed notification could not be marked as read:", error)
          if (!cancelled) {
            setActionError("Some notifications could not be marked as read. Please try again.")
          }
        }
      }
    }

    markViewedNotificationsRead()
    return () => {
      cancelled = true
    }
  }, [markRead.mutateAsync, pathname, role, visibleNotifications])

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
        {!isLoading && !error && visibleNotifications.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            You&apos;re all caught up.
          </p>
        )}
        {!isLoading && !error && visibleNotifications.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            {visibleNotifications.map((notification) => (
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
                  <span className="font-medium">
                    {getNotificationLabel(notification) ?? notification.title}
                  </span>
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

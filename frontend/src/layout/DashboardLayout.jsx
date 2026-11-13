import { cloneElement, isValidElement, useCallback, useMemo, useState } from "react"
import { Outlet } from "react-router-dom"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"

export function DashboardLayout({ onRequestServiceClick, notificationsContent }) {
  const [pageMeta, setPageMeta] = useState({})
  const [notificationCounts, setNotificationCounts] = useState({})

  const stableSetPageMeta = useCallback((meta) => {
    setPageMeta(meta)
  }, [])

  const outletContext = useMemo(
    () => ({ setPageMeta: stableSetPageMeta }),
    [stableSetPageMeta]
  )
  const notificationPanel = isValidElement(notificationsContent)
    ? cloneElement(notificationsContent, {
        onUnreadCountsChange: setNotificationCounts,
      })
    : notificationsContent

  return (
    <SidebarProvider>
      <AppSidebar notificationCounts={notificationCounts} />
      <SidebarInset>
        <DashboardHeader
          title={pageMeta.title}
          breadcrumbs={pageMeta.breadcrumbs ?? []}
          actions={pageMeta.actions}
          hasUnreadNotifications={pageMeta.hasUnreadNotifications}
          onNotificationsClick={pageMeta.onNotificationsClick}
          notificationsContent={notificationPanel}
          onRequestServiceClick={onRequestServiceClick ?? pageMeta.onRequestServiceClick}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet context={outletContext} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
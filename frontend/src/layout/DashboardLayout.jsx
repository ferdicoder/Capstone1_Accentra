import { useCallback, useState } from "react"
import { Outlet } from "react-router-dom"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"

const defaultUser = {
  name: "Jane Doe",
  email: "jane@accentra.com",
  avatar: "",
}

export function DashboardLayout({ role, user = defaultUser }) {
  const [pageMeta, setPageMeta] = useState({})

  const stableSetPageMeta = useCallback((meta) => {
    setPageMeta(meta)
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar role={role} user={user} />
      <SidebarInset>
        <DashboardHeader
          role={role}
          user={user}
          title={pageMeta.title}
          breadcrumbs={pageMeta.breadcrumbs ?? []}
          actions={pageMeta.actions}
          hasUnreadNotifications={pageMeta.hasUnreadNotifications}
          onNotificationsClick={pageMeta.onNotificationsClick}
          onRequestServiceClick={pageMeta.onRequestServiceClick}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet context={{ setPageMeta: stableSetPageMeta }} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

import { AppSidebar } from "@/components/dashboard/AppSidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"

export function DashboardLayout({
  role,
  user,
  title,
  breadcrumbs = [],
  actions,
  hasUnreadNotifications,
  onNotificationsClick,
  onRequestServiceClick,
  children,
}) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} user={user} />
      <SidebarInset>
        <DashboardHeader
          role={role}
          user={user}
          title={title}
          breadcrumbs={breadcrumbs}
          actions={actions}
          hasUnreadNotifications={hasUnreadNotifications}
          onNotificationsClick={onNotificationsClick}
          onRequestServiceClick={onRequestServiceClick}
        />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

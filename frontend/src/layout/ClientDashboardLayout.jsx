import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/app-Sidebar"
import { DashboardHeader } from "@/components/dashboard/DashboardHeader"

export function ClientDashboardLayout({ children }) {

  return (
    <SidebarProvider>

      <div className="flex min-h-svh w-full">

        <AppSidebar />

        <main className="flex-1">
          <DashboardHeader />

          {children}
        </main>

      </div>

    </SidebarProvider>
  )
}
import { Landmark } from "lucide-react"
 
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
 
import { NavMain } from "@/components/dashboard/NavMain"
import { NavUser } from "@/components/dashboard/NavUser"
import { roleConfig } from "@/components/dashboard/NavData"
 
const defaultUser = {
  name: "Jane Doe",
  email: "jane@accentra.com",
  avatar: "",
}
 
export function AppSidebar({ role = "firm-admin", user = defaultUser, ...props }) {
  const config = roleConfig[role] ?? roleConfig["firm-admin"]
 
  return (
    <Sidebar
      collapsible="icon"
      className="bg-sidebar text-white"
      {...props}
    >
      <SidebarHeader className="border-b border-white/10 px-2.5 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none hover:bg-transparent">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                <Landmark className="size-5 text-white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">Accentra</span>
                <span className="truncate text-xs text-white/60">
                  {config.label}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain label={config.label} items={config.nav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
 
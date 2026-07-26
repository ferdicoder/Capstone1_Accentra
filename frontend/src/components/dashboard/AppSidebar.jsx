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
      <SidebarHeader className="border-b border-white/10 px-2 py-4 group-data-[collapsible=icon]:px-2">
        <SidebarMenu> 
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="pointer-events-none hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:justify-center">
              <div className="flex size-8 shrink-0  items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/10 group-data-[collapsible=icon]:size-8">
                <Landmark className="size-5 text-white" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold tracking-tight">Accentra</span>
                <span className="truncate text-xs text-white/50">
                  {config.label}
                </span> 
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4  group-data-[collapsible=icon]:px-0">
        <NavMain label={config.label} items={config.nav} />
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-3  group-data-[collapsible=icon]:p-2 ">
        <NavUser user={user} />
      </SidebarFooter >
      <SidebarRail />
    </Sidebar>
  )
}
 
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

import { NavMain } from "@/components/dashboard/NavMain"
import { NavUser } from "@/components/dashboard/NavUser"
import { TeamSwitcher } from "@/components/dashboard/TeamSwitcher"
import { roleConfig } from "@/components/dashboard/NavData"

const defaultUser = {
  name: "Jane Doe",
  email: "jane@accentra.com",
  avatar: "",
}

export function AppSidebar({ role = "firm-admin", user = defaultUser, ...props }) {
  const config = roleConfig[role] ?? roleConfig["firm-admin"]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher team={config.team} />
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

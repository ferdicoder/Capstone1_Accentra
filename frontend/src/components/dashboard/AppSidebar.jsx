import darkLogo from "@/assets/Logo1.svg"

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
import { authStore } from "@/store/authStore"

export function AppSidebar({ role = "firm-admin", user, ...props }) {
  const config = roleConfig[role] ?? roleConfig["firm-admin"]
  const sessionUser = authStore((state) => state.user)
  const currentUser = user ?? sessionUser
  const metadata = currentUser?.user_metadata ?? {}
  const displayName = currentUser?.name ?? (
    [metadata.first_name, metadata.middle_name, metadata.last_name]
      .filter(Boolean)
      .join(" ") || currentUser?.email || "User"
  )
  const sidebarUser = currentUser
    ? {
        ...currentUser,
        name: displayName,
        email: currentUser.email ?? "",
        avatar: currentUser.avatar ?? metadata.avatar_url ?? "",
      }
    : null

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
              {/* Logo1.svg sits directly on the sidebar background - no icon
                  container, background, ring or shadow. Height matches the
                  previous glyph so the h-12 header height is unchanged. */}
              <img
                src={darkLogo}
                alt=""
                aria-hidden="true"
                className="h-5 w-auto shrink-0"
              />
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
        <NavUser user={sidebarUser} settingsHref={config.profileUrl} />
      </SidebarFooter >
      <SidebarRail />
    </Sidebar>
  )
}
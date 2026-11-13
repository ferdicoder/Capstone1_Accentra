import { useState } from "react"

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
import { useFetchFirmSettings } from "@/hooks/useFirmSettings"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { firmLogoUrl } from "@/services/api/firmSettingsAPI"

export function AppSidebar({ user, notificationCounts = {}, ...props }) {
  const role = authStore((state) => state.role)
  const sessionUser = authStore((state) => state.user)
  const config = roleConfig[role]
  const { data: settings } = useFetchFirmSettings()
  const {
    data: clientBusiness,
    isLoading: isClientBusinessLoading,
    error: clientBusinessError,
  } = useFetchMyBusiness(role === "client" ? sessionUser?.id : null)
  const [logoFailed, setLogoFailed] = useState(false)
  if (!config) return null

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

  const firmName = settings?.firmName?.trim() || "Accentra"
  const useCustomLogo = Boolean(settings?.logoStorageKey) && !logoFailed

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
              {/* Firm logo when one is uploaded, otherwise the platform mark.
                  Height matches the previous glyph so the h-12 header height
                  is unchanged. */}
              <img
                src={useCustomLogo ? firmLogoUrl : darkLogo}
                alt=""
                aria-hidden="true"
                onError={() => setLogoFailed(true)}
                className="h-5 w-auto max-w-[7rem] shrink-0 object-contain"
              />
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-semibold tracking-tight">{firmName}</span>
                <span className="truncate text-xs text-white/50">
                  {config.label}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4  group-data-[collapsible=icon]:px-0">
        <NavMain
          label={config.label}
          items={config.nav}
          notificationCounts={notificationCounts}
        />
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-3  group-data-[collapsible=icon]:p-2 ">
        <NavUser
          user={sidebarUser}
          subtitle={
            role === "client" && !isClientBusinessLoading && !clientBusinessError
              ? clientBusiness?.clientType === "retainer"
                ? "Retainer"
                : "Non-retainer"
              : null
          }
        />
      </SidebarFooter >
      <SidebarRail />
    </Sidebar>
  )
}
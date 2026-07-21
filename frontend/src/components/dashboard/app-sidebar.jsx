"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  BellIcon,
  BriefcaseIcon,
  CreditCardIcon,
  LayoutGridIcon,
  UserIcon,
} from "lucide-react"

const data = {
  user: {
    name: "Maria Santos",
    email: "maria@accentra.com",
    avatar: "/avatars/maria.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: <LayoutGridIcon />,
      isActive: true,
      items: [],
    },
    {
      title: "Engagement",
      url: "#",
      icon: <BriefcaseIcon />,
      items: [],
    },
    {
      title: "Billing & Payment",
      url: "#",
      icon: <CreditCardIcon />,
      items: [],
    },
    {
      title: "Notifications",
      url: "#",
      icon: <BellIcon />,
      items: [],
    },
    {
      title: "My Profile",
      url: "#",
      icon: <UserIcon />,
      items: [],
    },
  ],
}

export function AppSidebar(props) {
  return (
    <Sidebar
      collapsible="icon"
  className="bg-[#0F473E] text-emerald-50 shadow-[0_0_40px_rgba(0,0,0,0.3)] border-r border-white/10"
  {...props}
    >
      <SidebarHeader className="rounded-[24px] border border-white/10 bg-white/5 p-3 shadow-sm shadow-black/10">
        <div className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
            A
          </div>
          <div className="grid flex-1 gap-1">
            <p className="text-sm font-semibold text-sidebar-foreground">Accent ra</p>
            <p className="text-xs text-sidebar-foreground/70">Client Portal</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="py-2">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="pt-3 border-t border-white/10">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

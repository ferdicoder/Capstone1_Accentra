import { NavLink } from "react-router-dom"

import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function NavLinkItem({ item, isActive }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        tooltip={item.title}
        isActive={isActive}
        className="gap-4"
      >
        <NavLink to={item.url} className="flex w-full items-center gap-4">
          {item.icon && <item.icon className="size-4 shrink-0" />}
          <span className="truncate">{item.title}</span>
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

import { NavLink } from "react-router-dom"

import {
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavLinkItem({ item, isActive, notificationCount = 0 }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<NavLink to={item.url} className="flex w-full items-center gap-4" />}
        tooltip={item.title}
        isActive={isActive}
        className={notificationCount > 0 ? "gap-4 pr-10" : "gap-4"}
      >
        {item.icon && <item.icon className="size-4 shrink-0" />}
        <span className="truncate">{item.title}</span>
      </SidebarMenuButton>
      {notificationCount > 0 && (
        <SidebarMenuBadge
          aria-label={`${notificationCount} unread notifications`}
          // "!" beats the sidebar's built-in badge colour/position rules, which
          // otherwise turn the text light on the active row and pin the badge
          // to the top of the row.
          className="right-2 top-1/2! -translate-y-1/2 rounded-full bg-white! px-1.5 text-[11px] font-semibold text-forest-900!"
        >
          {notificationCount > 99 ? "99+" : notificationCount}
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  )
}
import { useState } from "react"
import { ChevronRight } from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

function isNavItemActive(pathname, url) {
  return pathname === url || pathname.startsWith(`${url}/`)
}

/**
 * Collapsible parent item (e.g. "Management") with child links.
 * - Expanded by default while the current route is one of its children.
 * - The user can toggle it at any time; a manual choice wins over the default.
 * - The parent is highlighted whenever one of its children is active.
 */
function NavGroup({ item, pathname }) {
  const isActive =
    isNavItemActive(pathname, item.url) ||
    item.items.some((subItem) => isNavItemActive(pathname, subItem.url))

  // null = follow the route (open while inside the group); true/false = user's choice.
  const [manualOpen, setManualOpen] = useState(null)
  const open = manualOpen ?? isActive

  return (
    <SidebarMenuItem>
      <Collapsible open={open} onOpenChange={setManualOpen}>
        <CollapsibleTrigger
          render={
            <SidebarMenuButton tooltip={item.title} isActive={isActive} className="gap-2" />
          }
        >
          {item.icon && <item.icon className="size-4 shrink-0" />}
          <span className="truncate">{item.title}</span>
          <ChevronRight
            className={cn(
              "ml-auto size-4 shrink-0 transition-transform duration-200 ease-in-out",
              open && "rotate-90"
            )}
          />
        </CollapsibleTrigger>

        <CollapsibleContent className="h-(--collapsible-panel-height) overflow-hidden transition-[height] duration-200 ease-in-out data-ending-style:h-0 data-starting-style:h-0">
          <SidebarMenuSub className="gap-1">
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  render={<NavLink to={subItem.url} />}
                  isActive={isNavItemActive(pathname, subItem.url)}
                >
                  {subItem.icon && <subItem.icon />}
                  <span className="truncate">{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}

export function NavMain({ items = [] }) {
  const { pathname } = useLocation()

  return (
    <SidebarGroup>
      <SidebarMenu className="gap-1">
        {items.map((item) => {
          const hasChildren = item.items && item.items.length > 0

          if (hasChildren) {
            return <NavGroup key={item.title} item={item} pathname={pathname} />
          }

          const isActive = isNavItemActive(pathname, item.url)

          return (
            <SidebarMenuItem key={item.title}>
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
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}

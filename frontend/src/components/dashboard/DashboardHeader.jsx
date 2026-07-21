import { Bell, CirclePlus } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

import { roleConfig } from "@/components/dashboard/NavData"

export function DashboardHeader({
  role,
  user,
  title,
  breadcrumbs = [],
  actions,
  hasUnreadNotifications = false,
  onNotificationsClick,
  onRequestServiceClick,
}) {
  const config = roleConfig[role]
  const profileHref = config?.profileUrl ?? "#"
  const isClient = role === "client"

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => {
              const isLast = index === breadcrumbs.length - 1
              return (
                <span className="flex items-center gap-1.5" key={crumb.label}>
                  <BreadcrumbItem className={!isLast ? "hidden md:block" : undefined}>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator className="hidden md:block" />}
                </span>
              )
            })}
            {breadcrumbs.length > 0 && title && (
              <BreadcrumbSeparator className="hidden md:block" />
            )}
            {title && (
              <BreadcrumbItem>
                <BreadcrumbPage>{title}</BreadcrumbPage>
              </BreadcrumbItem>
            )}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center gap-2 px-4">
        {actions}

        {isClient && (
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-to-br from-navy-900 via-forest-900 to-emerald-500 text-white hover:opacity-90"
            onClick={onRequestServiceClick}
          >
            <CirclePlus className="size-4" />
            <span className="hidden sm:inline">Request a Service</span>
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onNotificationsClick}
          aria-label="Notifications"
        >
          <Bell className="size-5" />
          {hasUnreadNotifications && (
            <span className="absolute right-2 top-2 size-2 rounded-full bg-emerald-500" />
          )}
        </Button>

        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <a href={profileHref} aria-label="Profile">
            <Avatar className="size-7">
              <AvatarImage src={user?.avatar} alt={user?.name} />
              <AvatarFallback className="text-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "AC"}
              </AvatarFallback>
            </Avatar>
          </a>
        </Button>
      </div>
    </header>
  )
}

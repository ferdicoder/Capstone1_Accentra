import {
  Bell,
  Briefcase,
  CreditCard,
  LayoutGrid,
  User,
} from "lucide-react"
 
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
 
const client = {
  name: "Maria Santos",
  business: "Santos Retail Trading",
  initials: "MS",
}
 
const mainNavItems = [
  { title: "Dashboard", url: "#", icon: LayoutGrid, isActive: true },
  { title: "Engagement", url: "#", icon: Briefcase },
  { title: "Billing & Payment", url: "#", icon: CreditCard },
  { title: "Notifications", url: "#", icon: Bell, badge: 4 },
]
 
const profileNavItems = [{ title: "My Profile", url: "#", icon: User }]
 
export function AppSidebar({ ...props }) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-none [&_[data-slot=sidebar-container]]:bg-gradient-to-b [&_[data-slot=sidebar-container]]:from-emerald-950 [&_[data-slot=sidebar-container]]:to-emerald-800"
      {...props}
    >
      <SidebarHeader className="bg-transparent px-4 py-4 text-emerald-50">
        <div className="flex items-center gap-3 border-b border-emerald-50/10 pb-4">
          <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500 text-sm font-semibold text-white">
            A
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-[15px] font-semibold">
              Accentra
            </span>
            <span className="truncate text-xs text-emerald-300/80">
              Client Portal
            </span>
          </div>
        </div>
 
        <div className="flex items-center gap-3 border-b border-emerald-50/10 py-4">
          <div className="flex size-9 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            {client.initials}
          </div>
          <div className="grid flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">
              {client.name}
            </span>
            <span className="truncate text-xs text-emerald-300/80">
              {client.business}
            </span>
          </div>
        </div>
      </SidebarHeader>
 
      <SidebarContent className="bg-transparent px-2 py-4 text-emerald-50">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {mainNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.isActive}
                    tooltip={item.title}
                    className="h-11 rounded-xl px-3 text-[15px] text-emerald-200/90 hover:bg-emerald-50/10 hover:text-emerald-50 data-[active=true]:bg-emerald-500 data-[active=true]:font-medium data-[active=true]:text-white data-[active=true]:hover:bg-emerald-500 data-[active=true]:hover:text-white"
                  >
                    <a href={item.url}>
                      <item.icon className="size-[18px]" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                  {item.badge && (
                    <SidebarMenuBadge className="bg-red-500 text-white">
                      {item.badge}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
 
        <SidebarSeparator className="my-2 bg-emerald-50/10" />
 
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {profileNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="h-11 rounded-xl px-3 text-[15px] text-emerald-200/90 hover:bg-emerald-50/10 hover:text-emerald-50"
                  >
                    <a href={item.url}>
                      <item.icon className="size-[18px]" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
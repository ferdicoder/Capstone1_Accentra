import {
  LayoutDashboard,
  Users,
  UserCog,
  Briefcase,
  Calendar,
  Settings,
  Receipt,
  ClipboardList,
} from "lucide-react"

export const firmAdminNav = [
  { title: "Home", url: "/firm-admin/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Clients", url: "/firm-admin/clients", icon: Users, items: [] },
  { title: "Service Requests", url: "/firm-admin/firm-users", icon: UserCog, items: [] },
  { title: "Services", url: "/admin/services", icon: ClipboardList, items: [] },
  { title: "Engagements", url: "/firm-admin/engagements", icon: Briefcase, items: [] },
  { title: "Calendar", url: "/firm-admin/calendar", icon: Calendar, items: [] },
  { title: "Billing", url: "/firm-admin/calendar", icon: Receipt, items: [] },
  { title: "Settings", url: "/firm-admin/settings", icon: Settings, items: [{title:"General", url:"/settings/general"},{title:"User Management", url:"/admin/users"}] },
]

export const firmUserNav = [
  { title: "Home", url: "/firm-user/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/firm-admin/firm-users", icon: UserCog, items: [] },
  { title: "Services", url: "/admin/services", icon: ClipboardList, items: [] },
  { title: "My Engagements", url: "/firm-user/engagements", icon: Briefcase, items: [] },
  { title: "Calendar", url: "/firm-user/calendar", icon: Calendar, items: [] },
  { title: "Settings", url: "/firm-admin/settings", icon: Settings, items: [{title:"General", url:"/settings/general"}, {title:"Account", url:"/settings/account"},] },
]


export const clientNav = [
  { title: "Home", url: "/client/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/firm-admin/firm-users", icon: UserCog, items: [] },
  { title: "My Engagements", url: "/client/engagements", icon: Briefcase, items: [] },
  { title: "Billing", url: "/client/invoices", icon: Receipt, items: [] },
  { title: "Settings", url: "/firm-admin/settings", icon: Settings, items: [{title:"General", url:"/settings/general"},{title:"Accounts", url:"/settings/account"},] },
]

export const roleConfig = {
  "firm-admin": {
    label: "Firm Admin",
    nav: firmAdminNav,
    team: { name: "Accentra", plan: "Firm Admin" },
    profileUrl: "/firm-admin/settings",
  },
  "firm-staff": {
    label: "Firm Staff",
    nav: firmUserNav,
    team: { name: "Accentra", plan: "Firm Staff" },
    profileUrl: "/firmstaff/profile",
  },
  "client": {
    label: "Client",
    nav: clientNav,
    team: { name: "Accentra", plan: "Client Portal" },
    profileUrl: "/client/profile",
  },
}

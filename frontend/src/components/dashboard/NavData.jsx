import {
  LayoutDashboard,
  UserCog,
  Briefcase,
  Settings,
  ClipboardList,
} from "lucide-react"

export const firmAdminNav = [
  { title: "Home", url: "/admin/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/admin/service-requests", icon: UserCog, items: [] },
  { title: "Services", url: "/admin/services", icon: ClipboardList, items: [] },
  { title: "Engagements", url: "/admin/engagements", icon: Briefcase, items: [] },
  {
    title: "Settings",
    url: "/admin/profile",
    icon: Settings,
    items: [
      { title: "Profile", url: "/admin/profile" },
      { title: "User Management", url: "/admin/users" },
    ],
  },
]

export const firmUserNav = [
  { title: "Home", url: "/firm/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/firm/service-requests", icon: UserCog, items: [] },
  { title: "Services", url: "/firm/services", icon: ClipboardList, items: [] },
  { title: "Engagements", url: "/firm/engagements", icon: Briefcase, items: [] },
]

export const clientNav = [
  { title: "Home", url: "/client/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/client/service-requests", icon: UserCog, items: [] },
  { title: "My Engagements", url: "/client/engagements", icon: Briefcase, items: [] },
  {
    title: "Settings",
    url: "/client/profile",
    icon: Settings,
    items: [{ title: "Profile", url: "/client/profile" }],
  },
]

export const roleConfig = {
  "firm-admin": {
    label: "Firm Admin",
    nav: firmAdminNav,
    team: { name: "Accentra", plan: "Firm Admin" },
    profileUrl: "/admin/profile",
  },
  "firm-staff": {
    label: "Firm Staff",
    nav: firmUserNav,
    team: { name: "Accentra", plan: "Firm Staff" },
    profileUrl: "/firm/dashboard",
  },
  client: {
    label: "Client",
    nav: clientNav,
    team: { name: "Accentra", plan: "Client Portal" },
    profileUrl: "/client/profile",
  },
}

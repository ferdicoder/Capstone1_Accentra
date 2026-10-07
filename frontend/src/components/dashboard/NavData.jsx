import {
  LayoutDashboard,
  UserCog,
  Briefcase,
  Users,
  Contact,
  FolderCog,
  ClipboardList,
  Receipt,
} from "lucide-react"

export const firmAdminNav = [
  { title: "Home", url: "/admin/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/admin/service-requests", icon: UserCog, items: [] },
  { title: "Services", url: "/admin/services", icon: ClipboardList, items: [] },
  { title: "Engagements", url: "/admin/engagements", icon: Briefcase, items: [] },
  { title: "Billing", url: "/admin/billing", icon: Receipt, items: [] },
  {
    title: "User Management",
    url: "/admin/users",
    icon: FolderCog,
    items: [
      { title: "Firm User", url: "/admin/users", icon: Users },
      { title: "Client", url: "/admin/clients", icon: Contact },
    ],
  },
]

export const firmUserNav = [
  { title: "Home", url: "/firm/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/firm/service-requests", icon: UserCog, items: [] },
  { title: "Services", url: "/firm/services", icon: ClipboardList, items: [] },
  { title: "Engagements", url: "/firm/engagements", icon: Briefcase, items: [] },
  {
    title: "User Management",
    url: "/firm/clients",
    icon: FolderCog,
    // Staff has no access to Firm User management, so only Client is listed.
    items: [{ title: "Client", url: "/firm/clients", icon: Contact }],
  },
]

export const clientNav = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/client/service-requests", icon: UserCog, items: [] },
  { title: "My Engagements", url: "/client/engagements", icon: Briefcase, items: [] },
  { title: "Billing", url: "/client/billing", icon: Receipt, items: [] },

]

export const billingOfficerNav = [
  { title: "Home",        url: "/billing-officer/dashboard",   icon: LayoutDashboard, items: [] },
  { title: "Engagements", url: "/billing-officer/engagements", icon: Briefcase,       items: [] },
  { title: "Billing",     url: "/billing-officer/billing",     icon: Receipt,         items: [] },
]

export const roleConfig = {
  admin: {
    label: "Firm Admin",
    nav: firmAdminNav,
    team: { name: "Accentra", plan: "Firm Admin" },
    profileUrl: "/admin/profile",
  },
  staff: {
    label: "Firm Staff",
    nav: firmUserNav,
    team: { name: "Accentra", plan: "Firm Staff" },
    profileUrl: "/firm/dashboard",
  },
  billing_officer: {
    label: "Billing Officer",
    nav: billingOfficerNav,
    team: { name: "Accentra", plan: "Billing Officer" },
    profileUrl: "/billing-officer/profile",
  },
  client: {
    label: "Client",
    nav: clientNav,
    team: { name: "Accentra", plan: "Client Portal" },
    profileUrl: "/client/profile",
  },
}
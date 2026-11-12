import {
  LayoutDashboard,
  UserCog,
  Briefcase,
  Users,
  Contact,
  ClipboardList,
  Receipt,
  FileText,
  UserRoundCog,
} from "lucide-react"

export const firmAdminNav = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Service Requests", url: "/admin/service-requests", icon: UserCog, items: [], notificationKey: "serviceRequests" },
  { title: "Services", url: "/admin/services", icon: ClipboardList, items: [], notificationKey: "services" },
  { title: "Engagements", url: "/admin/engagements", icon: Briefcase, items: [], notificationKey: "engagements" },
  { title: "Billing", url: "/admin/billing", icon: Receipt, items: [], notificationKey: "billing" },
  { title: "Reports", url: "/admin/reports", icon: FileText, items: [] },
  { title: "Teams", url: "/admin/users", icon: Users, items: [] },
  { title: "Clients", url: "/admin/clients", icon: Contact, items: [], notificationKey: "clients" },
  // Permanent item. Points at the existing admin profile route; change it if Settings has its own page.
  { title: "Account", url: "/admin/profile", icon: UserRoundCog, items: [] },
]

export const firmUserNav = [
  { title: "Dashboard", url: "/firm/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Services", url: "/firm/services", icon: ClipboardList, items: [], notificationKey: "services" },
  { title: "Engagements", url: "/firm/engagements", icon: Briefcase, items: [], notificationKey: "engagements" },
  // Staff has no access to Teams (firm user management), so only Clients is listed.
  { title: "Clients", url: "/firm/clients", icon: Contact, items: [] },
  { title: "Account", url: "/firm/profile", icon: UserRoundCog, items: [] },
]

export const clientNav = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard, items: [] },
<<<<<<< HEAD
  { title: "Service Requests", url: "/client/service-requests", icon: UserCog, items: [], notificationKey: "serviceRequests" },
  { title: "My Engagements", url: "/client/engagements", icon: Briefcase, items: [], notificationKey: "engagements" },
  { title: "Billing", url: "/client/billing", icon: Receipt, items: [], notificationKey: "billing" },
  // NEW: Calendar button, links to the Client calendar page
  { title: "Calendar", url: "/client/calendar", icon: CalendarDays, items: [] },
=======
  { title: "Service Requests", url: "/client/service-requests", icon: UserCog, items: [] },
  { title: "My Engagements", url: "/client/engagements", icon: Briefcase, items: [] },
  { title: "Billing", url: "/client/billing", icon: Receipt, items: [] },
>>>>>>> b3c1f6561d33742aa808c9c8b126f27dd7bca169
  { title: "Account", url: "/client/profile", icon: UserRoundCog, items: [] },
]

export const billingOfficerNav = [
  { title: "Dashboard",   url: "/billing-officer/dashboard",   icon: LayoutDashboard, items: [] },
  { title: "Engagements", url: "/billing-officer/engagements", icon: Briefcase, items: [], notificationKey: "engagements" },
  { title: "Billing", url: "/billing-officer/billing", icon: Receipt, items: [], notificationKey: "billing" },
  { title: "Clients",     url: "/billing-officer/clients",     icon: Contact,         items: [] },
  { title: "Account",     url: "/billing-officer/profile",     icon: UserRoundCog,    items: [] },
]

export const roleConfig = {
  admin: {
    label: "Firm Admin",
    nav: firmAdminNav,
    team: { name: "Accentra", plan: "Firm Admin" },
  },
  staff: {
    label: "Firm Staff",
    nav: firmUserNav,
    team: { name: "Accentra", plan: "Firm Staff" },
  },
  billing_officer: {
    label: "Billing Officer",
    nav: billingOfficerNav,
    team: { name: "Accentra", plan: "Billing Officer" },
  },
  client: {
    label: "Client",
    nav: clientNav,
    team: { name: "Accentra", plan: "Client Portal" },
  },
}
import {
  LayoutDashboard,
  Users,
  UserCog,
  Briefcase,
  ListTodo,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  ClipboardList,
  MessageSquare,
  Receipt,
  UserCircle,
} from "lucide-react"

export const firmAdminNav = [
  { title: "Dashboard", url: "/firm-admin/dashboard", icon: LayoutDashboard, items: [] },
  { title: "Clients", url: "/firm-admin/clients", icon: Users, items: [] },
  { title: "Firm Users", url: "/firm-admin/firm-users", icon: UserCog, items: [] },
  { title: "Engagements", url: "/firm-admin/engagements", icon: Briefcase, items: [] },
  { title: "Tasks", url: "/firm-admin/tasks", icon: ListTodo, items: [] },
  { title: "Documents", url: "/firm-admin/documents", icon: FileText, items: [] },
  { title: "Calendar", url: "/firm-admin/calendar", icon: Calendar, items: [] },
  { title: "Reports", url: "/firm-admin/reports", icon: BarChart3, items: [] },
  { title: "Settings", url: "/firm-admin/settings", icon: Settings, items: [] },
]

export const firmUserNav = [
  { title: "Dashboard", url: "/firm-user/dashboard", icon: LayoutDashboard, items: [] },
  { title: "My Engagements", url: "/firm-user/engagements", icon: Briefcase, items: [] },
  { title: "Tasks", url: "/firm-user/tasks", icon: ClipboardList, items: [] },
  { title: "Documents", url: "/firm-user/documents", icon: FileText, items: [] },
  { title: "Calendar", url: "/firm-user/calendar", icon: Calendar, items: [] },
  { title: "Profile", url: "/firm-user/profile", icon: UserCircle, items: [] },
]

export const clientNav = [
  { title: "Dashboard", url: "/client/dashboard", icon: LayoutDashboard, items: [] },
  { title: "My Engagements", url: "/client/engagements", icon: Briefcase, items: [] },
  { title: "Documents", url: "/client/documents", icon: FileText, items: [] },
  { title: "Messages", url: "/client/messages", icon: MessageSquare, items: [] },
  { title: "Invoices", url: "/client/invoices", icon: Receipt, items: [] },
  { title: "Profile", url: "/client/profile", icon: UserCircle, items: [] },
]

export const roleConfig = {
  "firm-admin": {
    label: "Firm Admin",
    nav: firmAdminNav,
    team: { name: "Accentra", plan: "Firm Admin" },
  },
  "firm-user": {
    label: "Firm User",
    nav: firmUserNav,
    team: { name: "Accentra", plan: "Firm User" },
  },
  "firm-staff": {
    label: "Firm Staff",
    nav: firmUserNav,
    team: { name: "Accentra", plan: "Firm Staff" },
  },
  client: {
    label: "Client",
    nav: clientNav,
    team: { name: "Accentra", plan: "Client Portal" },
  },
}

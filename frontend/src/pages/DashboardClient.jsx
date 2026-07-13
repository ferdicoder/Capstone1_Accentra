import { useState } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  Bell,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  ChevronsLeft,
  CreditCard,
  FileText,
  LayoutGrid,
  LogOut,
  Menu,
  ShieldCheck,
  Upload,
  User,
} from "lucide-react"
 
const client = {
  name: "Maria Santos",
  business: "Santos Retail Trading",
  initials: "MS",
}
 
const firm = {
  name: "Reyes & Associates CPA",
}
 
const mainNavItems = [
  { title: "Dashboard", url: "#", icon: LayoutGrid, isActive: true },
  { title: "Engagement", url: "#", icon: Briefcase },
  { title: "Billing & Payment", url: "#", icon: CreditCard },
  { title: "Notifications", url: "#", icon: Bell, badge: 4 },
]
 
const profileNavItems = [{ title: "My Profile", url: "#", icon: User }]
 
const breadcrumbTrail = [{ title: "Home" }]
 
const stats = [
  { label: "Active Engagements", value: 3, icon: FileText, tone: "blue" },
  { label: "Pending Documents", value: 4, icon: Upload, tone: "amber" },
  { label: "Upcoming Deadlines", value: 3, icon: ShieldCheck, tone: "green" },
  { label: "Unread Notifications", value: 5, icon: Bell, tone: "red" },
]
 
const engagements = [
  {
    title: "Annual ITR Filing",
    code: "ENG-2024-0041",
    due: "Apr 15, 2025",
    progress: 35,
    status: "Documents Needed",
    statusTone: "amber",
  },
  {
    title: "Business Permit Renewal",
    code: "ENG-2024-0038",
    due: "Jan 20, 2025",
    progress: 60,
    status: "Under Review",
    statusTone: "blue",
  },
  {
    title: "Quarterly VAT Return",
    code: "ENG-2024-0031",
    due: "Dec 31, 2024",
    progress: 85,
    status: "For Payment",
    statusTone: "purple",
  },
]
 
const pendingRequirements = [
  { title: "BIR Form 1701 - signed copy", code: "ENG-2024-0041" },
  { title: "Official receipts (Jan-Dec 2024)", code: "ENG-2024-0041" },
  { title: "Barangay clearance", code: "ENG-2024-0038" },
  { title: "DTI Certificate of Registration", code: "ENG-2024-0038" },
]
 
const upcomingDeadlines = [
  { title: "ITR Filing Deadline", date: "Apr 15, 2025", daysLeft: 123 },
  { title: "Business Permit Renewal", date: "Jan 20, 2025", daysLeft: 37 },
  { title: "VAT Return Q4", date: "Dec 31, 2024", daysLeft: 13, urgent: true },
]
 
const recentActivity = [
  {
    text: "Firm reviewed your documents for ENG-2024-0038",
    time: "2 hours ago",
    icon: CheckCircle2,
    tone: "green",
  },
  {
    text: "Revision requested on ENG-2024-0041 — missing OR booklet",
    time: "Yesterday, 3:14 PM",
    icon: AlertCircle,
    tone: "amber",
  },
  {
    text: "Invoice #INV-0041 issued — ₱4,500.00 due Dec 20",
    time: "Dec 10, 2024",
    icon: ArrowUpRight,
    tone: "purple",
  },
  {
    text: "ENG-2024-0027 marked complete — Quarterly ITR",
    time: "Nov 28, 2024",
    icon: CheckCircle2,
    tone: "green",
  },
]
 
const statusStyles = {
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  purple: "bg-purple-50 text-purple-700 border border-purple-200",
}
 
const iconToneStyles = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
}
 
function AppSidebar({ collapsed, onToggle }) {
  return (
    <div
      className={`flex h-full flex-col bg-gradient-to-b from-emerald-950 via-emerald-900 to-emerald-800 text-emerald-50 transition-all duration-200 ${
        collapsed ? "w-[72px]" : "w-64"
      }`}
    >
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 border-b border-emerald-50/10 pb-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-sm font-semibold text-white">
            A
          </div>
          {!collapsed && (
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-[15px] font-semibold">
                Accentra
              </span>
              <span className="truncate text-xs text-emerald-300/80">
                Client Portal
              </span>
            </div>
          )}
        </div>
 
        <div className="flex items-center gap-3 border-b border-emerald-50/10 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
            {client.initials}
          </div>
          {!collapsed && (
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">
                {client.name}
              </span>
              <span className="truncate text-xs text-emerald-300/80">
                {client.business}
              </span>
            </div>
          )}
        </div>
      </div>
 
      <div className="flex-1 px-2 py-4">
        <div className="flex flex-col gap-1.5">
          {mainNavItems.map((item) => (
            <a
              key={item.title}
              href={item.url}
              title={collapsed ? item.title : undefined}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] transition-colors ${
                item.isActive
                  ? "bg-emerald-500 font-medium text-white"
                  : "text-emerald-200/90 hover:bg-emerald-50/10 hover:text-emerald-50"
              } ${collapsed ? "justify-center px-0" : ""}`}
            >
              <item.icon className="size-[18px] shrink-0" />
              {!collapsed && (
                <span className="flex-1 truncate">{item.title}</span>
              )}
              {!collapsed && item.badge && (
                <span className="flex size-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-medium text-white">
                  {item.badge}
                </span>
              )}
            </a>
          ))}
        </div>
 
        <div className="my-3 h-px bg-emerald-50/10" />
 
        <div className="flex flex-col gap-1.5">
          {profileNavItems.map((item) => (
            <a
              key={item.title}
              href={item.url}
              title={collapsed ? item.title : undefined}
              className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] text-emerald-200/90 transition-colors hover:bg-emerald-50/10 hover:text-emerald-50 ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              <item.icon className="size-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.title}</span>}
            </a>
          ))}
        </div>
      </div>
 
      <div className="px-4 py-4">
        <div className="border-t border-emerald-50/10 pt-4">
          {!collapsed && (
            <>
              <p className="text-xs text-emerald-300/70">Assigned Firm</p>
              <p className="text-sm font-medium">{firm.name}</p>
            </>
          )}
          <button
            className={`mt-3 flex items-center gap-1.5 text-xs text-emerald-300/80 hover:text-emerald-50 ${
              collapsed ? "justify-center" : ""
            }`}
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="size-3.5 shrink-0" />
            {!collapsed && "Sign Out"}
          </button>
        </div>
      </div>
 
      <button
        onClick={onToggle}
        className="mx-2 mb-3 flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-emerald-300/70 hover:bg-emerald-50/10 hover:text-emerald-50"
      >
        <ChevronsLeft
          className={`size-4 transition-transform ${collapsed ? "rotate-180" : ""}`}
        />
        {!collapsed && "Collapse"}
      </button>
    </div>
  )
}
 
function Breadcrumb() {
  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {breadcrumbTrail.map((item, i) => {
        const isLast = i === breadcrumbTrail.length - 1
        return (
          <div key={item.title} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight className="size-3.5 text-muted-foreground" />
            )}
            {isLast ? (
              <span className="font-medium text-foreground">
                {item.title}
              </span>
            ) : (
              <a
                href={item.url}
                className="hidden text-muted-foreground hover:text-foreground md:block"
              >
                {item.title}
              </a>
            )}
          </div>
        )
      })}
    </nav>
  )
}
 
export default function DashboardPage() {
  const [collapsed, setCollapsed] = useState(false)
 
  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
 
      <div className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b">
          <div className="flex items-center gap-2 px-4">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="-ml-1 flex size-8 items-center justify-center rounded-lg hover:bg-muted"
            >
              <Menu className="size-4" />
            </button>
            <div className="mr-2 h-4 w-px bg-border" />
            <Breadcrumb />
          </div>
 
          <div className="flex items-center gap-3 px-4">
            <button className="relative flex size-9 items-center justify-center rounded-lg hover:bg-muted">
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-red-500" />
            </button>
            <button className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
              + Request Service
            </button>
            <div className="flex size-8 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white">
              MS
            </div>
          </div>
        </header>
 
        <div className="flex flex-1 flex-col gap-6 p-4">
          <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-6 text-white">
            <p className="text-sm text-emerald-100">Good afternoon</p>
            <h1 className="mt-1 text-2xl font-semibold">Welcome back, Maria</h1>
            <p className="mt-1 text-sm text-emerald-100">
              Santos Retail Trading · Client since 2022
            </p>
          </div>
 
          <div className="grid auto-rows-min gap-4 md:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, tone }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border bg-background p-4"
              >
                <div className={`rounded-lg p-2 ${iconToneStyles[tone]}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="text-xl font-semibold">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            ))}
          </div>
 
          <div className="grid flex-1 gap-4 lg:grid-cols-3">
            <div className="rounded-xl border bg-background p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Active Engagements</h2>
                <button className="flex items-center text-xs font-medium text-emerald-700 hover:text-emerald-800">
                  View all <ChevronRight className="size-3.5" />
                </button>
              </div>
 
              <div className="space-y-5">
                {engagements.map((e) => (
                  <div key={e.code}>
                    <div className="mb-1 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.code} · Due {e.due}
                        </p>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[e.statusTone]
                        }`}
                      >
                        {e.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 rounded-full bg-muted">
                        <div
                          className="h-1.5 rounded-full bg-emerald-600"
                          style={{ width: `${e.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {e.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
 
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border bg-background p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">
                    Pending Requirements
                  </h2>
                  <AlertCircle className="size-4 text-amber-500" />
                </div>
                <ul className="space-y-3">
                  {pendingRequirements.map((r) => (
                    <li key={r.title} className="flex items-start gap-2">
                      <span className="mt-1.5 size-1.5 flex-shrink-0 rounded-full bg-amber-400" />
                      <div>
                        <p className="text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.code}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
                <button className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
                  Upload documents <ChevronRight className="size-3.5" />
                </button>
              </div>
 
              <div className="rounded-xl border bg-background p-5">
                <h2 className="mb-4 text-sm font-semibold">
                  Upcoming Deadlines
                </h2>
                <ul className="space-y-3">
                  {upcomingDeadlines.map((d) => (
                    <li
                      key={d.title}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.date}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          d.urgent ? "text-red-600" : "text-muted-foreground"
                        }`}
                      >
                        {d.daysLeft}d
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
 
          <div className="rounded-xl border bg-background p-5">
            <h2 className="mb-4 text-sm font-semibold">Recent Activity</h2>
            <ul className="space-y-4">
              {recentActivity.map((a, i) => {
                const Icon = a.icon
                return (
                  <li
                    key={i}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-full p-1.5 ${iconToneStyles[a.tone]}`}
                      >
                        <Icon className="size-3.5" />
                      </div>
                      <p className="text-sm">{a.text}</p>
                    </div>
                    <span className="whitespace-nowrap text-xs text-muted-foreground">
                      {a.time}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
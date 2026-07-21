import {
  Home,
  Briefcase,
  CreditCard,
  Bell,
  User,
  FileText,
  Upload,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
} from "lucide-react";
 
const stats = [
  { label: "Active Engagements", value: 3, icon: FileText, tone: "blue" },
  { label: "Pending Documents", value: 4, icon: Upload, tone: "amber" },
  { label: "Upcoming Deadlines", value: 3, icon: ShieldCheck, tone: "green" },
  { label: "Unread Notifications", value: 5, icon: Bell, tone: "red" },
];
 
const navItems = [
  { label: "Dashboard", icon: Home, active: true },
  { label: "Engagement", icon: Briefcase },
  { label: "Billing & Payment", icon: CreditCard },
  { label: "Notifications", icon: Bell },
  { label: "My Profile", icon: User },
];
 
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
];
 
const pendingRequirements = [
  { title: "BIR Form 1701 - signed copy", code: "ENG-2024-0041" },
  { title: "Official receipts (Jan-Dec 2024)", code: "ENG-2024-0041" },
  { title: "Barangay clearance", code: "ENG-2024-0038" },
  { title: "DTI Certificate of Registration", code: "ENG-2024-0038" },
];
 
const upcomingDeadlines = [
  { title: "ITR Filing Deadline", date: "Apr 15, 2025", daysLeft: 123 },
  { title: "Business Permit Renewal", date: "Jan 20, 2025", daysLeft: 37 },
  { title: "VAT Return Q4", date: "Dec 31, 2024", daysLeft: 13, urgent: true },
];
 
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
];
 
const statusStyles = {
  amber: "bg-amber-50 text-amber-700 border border-amber-200",
  blue: "bg-blue-50 text-blue-700 border border-blue-200",
  purple: "bg-purple-50 text-purple-700 border border-purple-200",
};
 
const iconToneStyles = {
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-green-50 text-green-600",
  red: "bg-red-50 text-red-600",
  purple: "bg-purple-50 text-purple-600",
};
 
function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col bg-gradient-to-b from-emerald-950 to-emerald-900 text-emerald-50">
      <div className="flex items-center gap-3 border-b border-emerald-800/60 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-900">
          A
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">Accentra</p>
          <p className="text-xs text-emerald-300">Client Portal</p>
        </div>
      </div>
 
      <div className="flex items-center gap-3 border-b border-emerald-800/60 px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-semibold">
          MS
        </div>
        <div>
          <p className="text-sm font-medium leading-tight">Maria Santos</p>
          <p className="text-xs text-emerald-300">Santos Retail Trading</p>
        </div>
      </div>
 
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ label, icon: Icon, active }) => (
          <button
            key={label}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-emerald-50 font-medium text-emerald-900"
                : "text-emerald-200 hover:bg-emerald-800/50"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-600" />
            )}
          </button>
        ))}
      </nav>
 
      <div className="border-t border-emerald-800/60 px-5 py-4">
        <p className="text-xs text-emerald-400">Assigned Firm</p>
        <p className="text-sm font-medium">Reyes &amp; Associates CPA</p>
        <button className="mt-3 text-xs text-emerald-300 hover:text-emerald-100">
          Sign Out
        </button>
      </div>
    </aside>
  );
}
 
function TopBar() {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-4">
      <p className="text-sm text-slate-500">Home</p>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          + Request Service
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-800 text-xs font-semibold text-white">
          MS
        </div>
      </div>
    </header>
  );
}
 
function WelcomeBanner() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-600 px-6 py-6 text-white">
      <p className="text-sm text-emerald-100">Good afternoon</p>
      <h1 className="mt-1 text-2xl font-semibold">Welcome back, Maria</h1>
      <p className="mt-1 text-sm text-emerald-100">
        Santos Retail Trading · Client since 2022
      </p>
    </div>
  );
}
 
function StatCards() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, icon: Icon, tone }) => (
        <div
          key={label}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4"
        >
          <div className={`rounded-lg p-2 ${iconToneStyles[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
 
function ActiveEngagements() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Active Engagements
        </h2>
        <button className="flex items-center text-xs font-medium text-emerald-700 hover:text-emerald-800">
          View all <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
 
      <div className="space-y-5">
        {engagements.map((e) => (
          <div key={e.code}>
            <div className="mb-1 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {e.title}
                </p>
                <p className="text-xs text-slate-500">
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
              <div className="h-1.5 flex-1 rounded-full bg-slate-100">
                <div
                  className="h-1.5 rounded-full bg-emerald-600"
                  style={{ width: `${e.progress}%` }}
                />
              </div>
              <span className="text-xs text-slate-500">{e.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
 
function PendingRequirements() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Pending Requirements
        </h2>
        <AlertCircle className="h-4 w-4 text-amber-500" />
      </div>
      <ul className="space-y-3">
        {pendingRequirements.map((r) => (
          <li key={r.title} className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
            <div>
              <p className="text-sm text-slate-800">{r.title}</p>
              <p className="text-xs text-slate-500">{r.code}</p>
            </div>
          </li>
        ))}
      </ul>
      <button className="mt-4 flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800">
        Upload documents <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
 
function UpcomingDeadlines() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">
        Upcoming Deadlines
      </h2>
      <ul className="space-y-3">
        {upcomingDeadlines.map((d) => (
          <li key={d.title} className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-800">{d.title}</p>
              <p className="text-xs text-slate-500">{d.date}</p>
            </div>
            <span
              className={`text-xs font-medium ${
                d.urgent ? "text-red-600" : "text-slate-500"
              }`}
            >
              {d.daysLeft}d
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
 
function RecentActivity() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">
        Recent Activity
      </h2>
      <ul className="space-y-4">
        {recentActivity.map((a, i) => {
          const Icon = a.icon;
          return (
            <li key={i} className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-1.5 ${iconToneStyles[a.tone]}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="text-sm text-slate-800">{a.text}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-slate-400">
                {a.time}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
 
export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <TopBar />
        <main className="space-y-6 px-8 py-6">
          <WelcomeBanner />
          <StatCards />
 
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ActiveEngagements />
            </div>
            <div className="space-y-6">
              <PendingRequirements />
              <UpcomingDeadlines />
            </div>
          </div>
 
          <RecentActivity />
        </main>
      </div>
    </div>
  );
}
 
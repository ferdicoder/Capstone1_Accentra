import {
  ChevronDown,
  ChevronLeft,
  Bell,
  Gift,
  Users,
  CreditCard,
  Calendar,
  Briefcase,
  LayoutDashboard,
  FileText,
  Receipt,
  Plus,
  CheckCircle2,
  Clock3,
} from "lucide-react";

const sidebarItems = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        active: true,
      },
      {
        label: "Service Requests",
        icon: FileText,
        children: [
          "All Requests",
          "Pending Review",
          "Create Engagement",
        ],
      },
      {
        label: "Engagements",
        icon: Briefcase,
        children: ["Processing", "Details"],
      },
      {
        label: "Calendar",
        icon: Calendar,
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        label: "Billing",
        icon: Receipt,
        children: [
          "Invoices",
          "Confirm Payment",
        ],
      },
      {
        label: "Notifications",
        icon: Bell,
        badge: 4,
      },
      {
        label: "Services",
        icon: Gift,
      },
      {
        label: "User Management",
        icon: Users,
      },
    ],
  },
];

const statCards = [
  {
    icon: Gift,
    value: "2",
    title: "New Requests",
    subtitle: "Awaiting review",
    accent: "text-red-400",
  },
  {
    icon: Users,
    value: "3",
    title: "Active Engagements",
    subtitle: "In progress",
    accent: "text-emerald-300",
  },
  {
    icon: CreditCard,
    value: "₱4,200",
    title: "Pending Billing",
    subtitle: "Unpaid invoices",
    accent: "text-yellow-300",
  },
];

function Sidebar() {
  return (
    <aside className="w-[240px] bg-gradient-to-b from-[#043C43] to-[#1D7A68] text-white flex flex-col">
      {/* Firm Header */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold">
              M
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Maria
              </h3>

              <p className="text-xs text-white/60">
                CPA from Reyes & Associates
              </p>
            </div>
          </div>

          <ChevronLeft size={14} />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {sidebarItems.map((section) => (
          <div
            key={section.title}
            className="mb-8"
          >
            <p className="mb-3 text-xs font-semibold tracking-widest text-white/40">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label}>
                    <button
                      className={`flex w-full items-center rounded-xl px-3 py-3 text-sm transition ${
                        item.active
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5"
                      }`}
                    >
                      <Icon
                        size={16}
                        className="mr-3"
                      />

                      <span className="flex-1 text-left">
                        {item.label}
                      </span>

                      {item.badge && (
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs">
                          {item.badge}
                        </span>
                      )}

                      {item.children && (
                        <ChevronDown
                          size={14}
                        />
                      )}
                    </button>

                    {item.children && (
                      <div className="ml-7 mt-2 space-y-2 border-l border-white/10 pl-4">
                        {item.children.map(
                          (child) => (
                            <button
                              key={child}
                              className="block text-sm text-white/60 hover:text-white"
                            >
                              {child}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 p-4">
        <button className="mb-4 flex w-full items-center justify-center rounded-xl bg-white/5 py-3 text-sm">
          Invite Team / Client
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-400 text-xs font-bold text-black">
            M
          </div>

          <div>
            <p className="text-sm font-medium">
              CPA_Maria
            </p>

            <p className="text-xs text-white/50">
              Maria@reyesassociates.ph
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar() {
  return (
    <header className="flex items-center justify-between">
      <div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-slate-600">
            Maria
          </span>

          <span className="text-emerald-300">
            &gt;
          </span>

          <span className="font-medium text-emerald-600">
            Dashboard
          </span>
        </div>

        <h1 className="mt-6 text-5xl font-bold text-slate-900">
          Good afternoon, Maria (CPA)
        </h1>

        <p className="mt-2 text-lg text-slate-600">
          Here's what's happening with your firm today.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full bg-white p-3 shadow">
          <Bell size={18} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-400 font-bold">
          M
        </div>
      </div>
    </header>
  );
}

function StatsCards() {
  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-3xl bg-gradient-to-br from-[#034D52] to-[#2DB57D] p-6 text-white shadow-lg"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="rounded-xl border border-white/20 p-3">
                <Icon size={18} />
              </div>

              <div className="rounded-full border border-white/20 p-2">
                <ChevronLeft className="rotate-180" size={16} />
              </div>
            </div>

            <h2 className="text-5xl font-bold">
              {card.value}
            </h2>

            <p className="mt-2 text-2xl font-semibold">
              {card.title}
            </p>

            <p
              className={`mt-1 text-sm ${card.accent}`}
            >
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}

const deadlines = [
  {
    id: "ENG-2025-045",
    client: "Santos Retail Trading",
    service: "Annual ITR Filing",
    assignee: "Sarah Lim",
    due: "Jul 15, 2025",
    left: "13d left",
    status: "Processing",
    color: "bg-emerald-500",
  },
  {
    id: "ENG-2025-044",
    client: "BluePeak Corp",
    service: "Business Advisory",
    assignee: "Mark Tan",
    due: "Jul 1, 2025",
    left: "1d overdue",
    status: "Under Review",
    color: "bg-red-500",
  },
  {
    id: "ENG-2025-042",
    client: "Verde Solutions",
    service: "Quarterly VAT Return",
    assignee: "Jane Reyes",
    due: "Jul 20, 2025",
    left: "18d left",
    status: "Processing",
    color: "bg-emerald-500",
  },
  {
    id: "ENG-2025-041",
    client: "Lim Trading Corp",
    service: "Monthly Bookkeeping",
    assignee: "Carlo Vega",
    due: "Jul 8, 2025",
    left: "6d left",
    status: "Processing",
    color: "bg-amber-500",
  },
  {
    id: "ENG-2025-040",
    client: "Meridian Holdings",
    service: "Audit & Assurance",
    assignee: "Ana Dizon",
    due: "Jul 25, 2025",
    left: "23d left",
    status: "Processing",
    color: "bg-emerald-500",
  },
];

const activities = [
  {
    text: "New request from Santos Retail Trading",
    time: "2 min ago",
  },
  {
    text: "BluePeak Corp submitted 3 documents",
    time: "18 min ago",
  },
  {
    text: "ENG-2025-043 marked completed by Jane Reyes",
    time: "1 hr ago",
  },
  {
    text: "Invoice #INV-0028 paid by Verde Solutions",
    time: "3 hr ago",
  },
  {
    text: "Meridian Holdings submitted Audit request",
    time: "5 hr ago",
  },
];

function UpcomingDeadlines() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border-t-2 border-emerald-500/15">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-900">
          Upcoming Deadlines
        </h2>
        <button className="text-sm text-emerald-600 hover:text-emerald-700">
          View All
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-emerald-200 text-xs font-medium uppercase tracking-wider text-emerald-600">
              <th className="pb-3 pr-4">Engagement</th>
              <th className="pb-3 pr-4">Client</th>
              <th className="pb-3 pr-4">Service</th>
              <th className="pb-3 pr-4">Assignee</th>
              <th className="pb-3 pr-4">Due</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3"></th>
            </tr>
          </thead>
          <tbody>
            {deadlines.map((d) => (
              <tr
                key={d.id}
                className="border-b border-emerald-100/50 text-sm transition-colors hover:bg-emerald-50/70"
              >
                <td className="py-4 pr-4 font-medium text-slate-900">
                  {d.id}
                </td>
                <td className="py-4 pr-4 text-slate-700">{d.client}</td>
                <td className="py-4 pr-4 text-slate-700">{d.service}</td>
                <td className="py-4 pr-4 text-slate-700">{d.assignee}</td>
                <td className="py-4 pr-4 text-slate-700">{d.due}</td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      d.status === "Under Review"
                        ? "bg-red-50 text-red-600"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        d.status === "Under Review"
                          ? "bg-red-500"
                          : "bg-emerald-500"
                      }`}
                    />
                    {d.status}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span
                    className={`text-xs font-medium ${
                      d.left.includes("overdue")
                        ? "text-red-500"
                        : "text-slate-500"
                    }`}
                  >
                    {d.left}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RecentActivity() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border-t-2 border-emerald-500/15">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-900">
          Recent Activity
        </h2>
        <button className="text-sm text-emerald-600 hover:text-emerald-700">
          View All
        </button>
      </div>
      <div className="space-y-0">
        {activities.map((a, i) => (
          <div
            key={i}
            className="flex items-start gap-3 border-b border-emerald-100/40 py-3 last:border-0"
          >
            <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
            <div className="flex-1">
              <p className="text-sm text-slate-800">{a.text}</p>
              <p className="mt-0.5 text-xs text-emerald-600/60">{a.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    { label: "New Engagement", desc: "Create a new client engagement" },
    { label: "Invite Client", desc: "Send portal invitation" },
    { label: "Generate Report", desc: "Create a summary report" },
  ];

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border-t-2 border-emerald-500/15">
      <h2 className="mb-4 text-lg font-semibold text-emerald-900">
        Quick Actions
      </h2>
      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.label}
            className="flex w-full items-center justify-between rounded-xl border border-emerald-200/60 px-4 py-3 text-left transition-all hover:border-emerald-400 hover:bg-emerald-50"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {action.label}
              </p>
              <p className="text-xs text-emerald-700/70">{action.desc}</p>
            </div>
            <ChevronDown size={16} className="-rotate-90 text-emerald-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-emerald-50/40">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-7">
        <TopBar />

        <StatsCards />

        <div className="mt-5 grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <UpcomingDeadlines />
          </div>

          <div className="col-span-4 space-y-4">
            <RecentActivity />
            <QuickActions />
          </div>
        </div>
      </main>
    </div>
  );
}
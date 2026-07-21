import {
  ChevronDown,
  ChevronLeft,
  Bell,
  Users,
  CreditCard,
  Briefcase,
  LayoutDashboard,
  FileText,
  Receipt,
  Settings,
  Building2,
  FolderCheck,
  UserCog,
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
        label: "Staff Management",
        icon: UserCog,
        children: [
          "Staff Accounts",
          "Roles & Permissions",
        ],
      },
      {
        label: "Client Management",
        icon: Building2,
        children: [
          "Clients",
          "Client Requests",
        ],
      },
      {
        label: "Engagements",
        icon: Briefcase,
        children: [
          "Active Engagements",
          "Completed Engagements",
        ],
      },
    ],
  },

  {
    title: "OPERATIONS",
    items: [
      {
        label: "Client Documents",
        icon: FolderCheck,
        children: [
          "Pending Review",
          "Approved",
          "Rejected",
        ],
      },
      {
        label: "Billing",
        icon: Receipt,
        children: [
          "Invoices",
          "Payments",
        ],
      },
      {
        label: "Notifications",
        icon: Bell,
        badge: 5,
      },
    ],
  },

  {
    title: "FIRM",
    items: [
      {
        label: "Firm Profile",
        icon: Building2,
      },
      {
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];

const statCards = [
  {
    icon: FileText,
    value: "12",
    title: "Pending Requests",
    subtitle: "Awaiting review",
    accent: "text-red-300",
  },

  {
    icon: Briefcase,
    value: "18",
    title: "Active Engagements",
    subtitle: "Currently processing",
    accent: "text-emerald-300",
  },

  {
    icon: FolderCheck,
    value: "9",
    title: "Pending Documents",
    subtitle: "Need approval",
    accent: "text-yellow-300",
  },

  {
    icon: CreditCard,
    value: "₱78,400",
    title: "Outstanding Payments",
    subtitle: "Pending collection",
    accent: "text-cyan-300",
  },
];

const requests = [
  {
    id: "REQ-2026-104",
    client: "ABC Trading Corp",
    service: "Bookkeeping Services",
    submitted: "Jul 18, 2026",
    status: "Pending",
  },
  {
    id: "REQ-2026-103",
    client: "Vertex Solutions",
    service: "Tax Filing",
    submitted: "Jul 17, 2026",
    status: "Approved",
  },
  {
    id: "REQ-2026-102",
    client: "Prime Retail Inc.",
    service: "Payroll Services",
    submitted: "Jul 16, 2026",
    status: "Pending",
  },
  {
    id: "REQ-2026-101",
    client: "BluePeak Corp",
    service: "Business Advisory",
    submitted: "Jul 15, 2026",
    status: "Rejected",
  },
  {
    id: "REQ-2026-100",
    client: "Golden Harvest Foods",
    service: "Audit Assistance",
    submitted: "Jul 14, 2026",
    status: "Approved",
  },
];

const activities = [
  {
    text: "New client request submitted by ABC Trading Corp",
    time: "3 mins ago",
  },
  {
    text: "Invoice INV-102 generated",
    time: "25 mins ago",
  },
  {
    text: "Document approved for Vertex Solutions",
    time: "1 hour ago",
  },
  {
    text: "New staff account added",
    time: "2 hours ago",
  },
  {
    text: "Engagement ENG-2026-018 created",
    time: "4 hours ago",
  },
];

function Sidebar() {
  return (
    <aside className="w-[240px] bg-gradient-to-b from-[#043C43] to-[#1D7A68] text-white flex flex-col">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 font-bold">
              A
            </div>

            <div>
              <h3 className="text-sm font-semibold">
                Reyes & Associates
              </h3>

              <p className="text-xs text-white/60">
                Firm Administrator
              </p>
            </div>
          </div>

          <ChevronLeft size={14} />
        </div>
      </div>

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
                        <ChevronDown size={14} />
                      )}
                    </button>

                    {item.children && (
                      <div className="ml-7 mt-2 space-y-2 border-l border-white/10 pl-4">
                        {item.children.map((child) => (
                          <button
                            key={child}
                            className="block text-sm text-white/60 hover:text-white"
                          >
                            {child}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10 p-4">
        <button className="mb-4 flex w-full items-center justify-center rounded-xl bg-white/5 py-3 text-sm">
          Add Staff Member
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-xs font-bold text-black">
            FA
          </div>

          <div>
            <p className="text-sm font-medium">
              Firm Administrator
            </p>

            <p className="text-xs text-white/50">
              admin@firm.com
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
            Reyes & Associates
          </span>

          <span className="text-emerald-300">&gt;</span>

          <span className="font-medium text-emerald-600">
            Firm Dashboard
          </span>
        </div>

        <h1 className="mt-6 text-5xl font-bold text-slate-900">
          Good afternoon, Administrator
        </h1>

        <p className="mt-2 text-lg text-slate-600">
          Manage your firm's clients, engagements, staff, and billing.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative rounded-full bg-white p-3 shadow">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400 font-bold">
          FA
        </div>
      </div>
    </header>
  );
}

function StatsCards() {
  return (
    <div className="mt-8 grid grid-cols-4 gap-4">
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
                <ChevronLeft
                  className="rotate-180"
                  size={16}
                />
              </div>
            </div>

            <h2 className="text-5xl font-bold">
              {card.value}
            </h2>

            <p className="mt-2 text-2xl font-semibold">
              {card.title}
            </p>

            <p className={`mt-1 text-sm ${card.accent}`}>
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ClientRequestsQueue() {
  return (
    <div className="rounded-2xl border-t-2 border-emerald-500/15 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-900">
          Client Requests Queue
        </h2>

        <button className="text-sm text-emerald-600 hover:text-emerald-700">
          View All
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-emerald-200 text-xs font-medium uppercase tracking-wider text-emerald-600">
              <th className="pb-3 pr-4">Request ID</th>
              <th className="pb-3 pr-4">Client</th>
              <th className="pb-3 pr-4">Requested Service</th>
              <th className="pb-3 pr-4">Submitted Date</th>
              <th className="pb-3 pr-4">Status</th>
              <th className="pb-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {requests.map((request) => (
              <tr
                key={request.id}
                className="border-b border-emerald-100/50 text-sm transition-colors hover:bg-emerald-50/70"
              >
                <td className="py-4 pr-4 font-medium text-slate-900">
                  {request.id}
                </td>

                <td className="py-4 pr-4 text-slate-700">
                  {request.client}
                </td>

                <td className="py-4 pr-4 text-slate-700">
                  {request.service}
                </td>

                <td className="py-4 pr-4 text-slate-700">
                  {request.submitted}
                </td>

                <td className="py-4 pr-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                      request.status === "Approved"
                        ? "bg-emerald-50 text-emerald-600"
                        : request.status === "Rejected"
                        ? "bg-red-50 text-red-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        request.status === "Approved"
                          ? "bg-emerald-500"
                          : request.status === "Rejected"
                          ? "bg-red-500"
                          : "bg-amber-500"
                      }`}
                    />

                    {request.status}
                  </span>
                </td>

                <td className="py-4">
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200">
                      Approve
                    </button>

                    <button className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 transition hover:bg-red-200">
                      Reject
                    </button>
                  </div>
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
    <div className="rounded-2xl border-t-2 border-emerald-500/15 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-emerald-900">
          Recent Activity
        </h2>

        <button className="text-sm text-emerald-600 hover:text-emerald-700">
          View All
        </button>
      </div>

      <div className="space-y-0">
        {activities.map((activity, index) => (
          <div
            key={index}
            className="flex items-start gap-3 border-b border-emerald-100/40 py-3 last:border-0"
          >
            <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500" />

            <div className="flex-1">
              <p className="text-sm text-slate-800">
                {activity.text}
              </p>

              <p className="mt-0.5 text-xs text-emerald-600/60">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickActions() {
  const actions = [
    {
      label: "Create Engagement",
      desc: "Open a new client engagement",
    },
    {
      label: "Review Documents",
      desc: "Approve pending client files",
    },
    {
      label: "Add Staff Member",
      desc: "Create a new staff account",
    },
    {
      label: "Generate Invoice",
      desc: "Create billing records",
    },
  ];

  return (
    <div className="rounded-2xl border-t-2 border-emerald-500/15 bg-white p-6 shadow-sm">
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

              <p className="text-xs text-emerald-700/70">
                {action.desc}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="-rotate-90 text-emerald-400"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DashboardFirmAdmin() {
  return (
    <div className="flex h-screen bg-emerald-50/40">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-7">
        <TopBar />

        <StatsCards />

        <div className="mt-5 grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <ClientRequestsQueue />
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
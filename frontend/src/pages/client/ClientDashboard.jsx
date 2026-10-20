import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  FileText,
  Hourglass,
  Receipt,
  Upload,
} from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { ActivityLogItem } from "@/components/firm/engagements/ActivityLogItem"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import {
  useFetchMyEngagements,
  useFetchEngagementActivity,
} from "@/hooks/useEngagements"
import { useFetchMyServiceRequests } from "@/hooks/useServiceRequests"
import { useFetchBusinessBillings } from "@/hooks/useBillings"
import { authStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
// Shared with the Client calendar: local-time date helpers (no timezone shift).
import {
  describeDueDate,
  formatCurrency,
  parseDate,
  pluralize,
  useToday,
} from "@/pages/client/ClientBillingCalendar/calendar-utils"

// --- Vocabulary (same as the other client pages) ------------------------------

const engagementStatusLabels = {
  pending: "Under Review",
  active: "Documents Needed",
  completed: "Completed",
  cancelled: "Cancelled",
}

const requestStatusMeta = {
  pending: { label: "Pending Review", tone: "bg-amber-50 text-amber-700" },
  approved: { label: "Approved", tone: "bg-blue-50 text-blue-700" },
  "in-progress": { label: "In Progress", tone: "bg-blue-50 text-blue-700" },
  rejected: { label: "Declined", tone: "bg-red-50 text-red-700" },
  cancelled: { label: "Cancelled", tone: "bg-gray-100 text-gray-600" },
}

const OPEN_REQUEST_STATUSES = ["pending", "approved", "in-progress"]
const OPEN_ENGAGEMENT_STATUSES = ["pending", "active"]
// Task statuses where the client still has to upload something.
const CLIENT_TASK_STATUSES = ["missing", "for_revision"]

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"

// --- Helpers -----------------------------------------------------------------

const getDueDate = (invoice) => invoice.dueDate ?? invoice.due_date ?? null

const formatDay = (value) => {
  const date = parseDate(value)
  return date
    ? date.toLocaleDateString("en-PH", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—"
}

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

// One bucket per invoice, so nothing is counted twice.
//   paid | review | overdue | open | closed
function classifyInvoice(invoice, today) {
  if (invoice.status === "paid") return "paid"
  if (["cancelled", "refunded"].includes(invoice.status)) return "closed"
  if (invoice.payment_status === "pending") return "review"
  const due = parseDate(getDueDate(invoice))
  if (invoice.status === "overdue" || (due && due < today)) return "overdue"
  return "open"
}

// Documents the client still has to upload for an engagement. Uses the task
// list when the hook returns it, otherwise falls back to the engagement status.
function getDocumentsNeeded(engagement) {
  if (Array.isArray(engagement.tasks) && engagement.tasks.length > 0) {
    return engagement.tasks.filter((task) =>
      CLIENT_TASK_STATUSES.includes(task.status)
    ).length
  }
  return engagement.status === "active" ? 1 : 0
}

// Approved tasks / total tasks, or null when tasks are not available.
function getTaskProgress(engagement) {
  const tasks = engagement.tasks
  if (!Array.isArray(tasks) || tasks.length === 0) return null
  const approved = tasks.filter((task) => task.status === "approved").length
  return {
    approved,
    total: tasks.length,
    percent: Math.round((approved / tasks.length) * 100),
  }
}

// --- Small building blocks -----------------------------------------------------

function StatCard({ to, icon: Icon, label, value, hint, tone }) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-xl border bg-background p-4 transition-colors hover:bg-muted/40",
        focusRing
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={cn(
              "flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground",
              tone
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
          {label}
        </span>
        <ArrowRight
          className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Link>
  )
}

function Panel({ title, description, to, linkLabel = "View all", children, className }) {
  return (
    <section className={cn("overflow-hidden rounded-xl border bg-background", className)}>
      <div className="flex items-start justify-between gap-3 border-b px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {to && (
          <Link
            to={to}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-emerald-700 hover:underline",
              focusRing
            )}
          >
            {linkLabel}
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-4 py-8 text-center">
      <div className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{children}</p>
    </div>
  )
}

function ProgressBar({ percent, label }) {
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
    >
      <div
        className="h-full rounded-full bg-emerald-600 transition-[width]"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

// --- Page ------------------------------------------------------------------------

export default function ClientDashboard() {
  const navigate = useNavigate()
  const today = useToday()
  const user = authStore((state) => state.user)
  const authLoading = authStore((state) => state.loading)

  const { data: business, isLoading: businessLoading } = useFetchMyBusiness(user?.id)
  const businessId = business?.id

  const {
    data: engagements = [],
    isLoading: engagementsLoading,
    error: engagementsError,
  } = useFetchMyEngagements(businessId)
  const {
    data: requests = [],
    isLoading: requestsLoading,
    error: requestsError,
  } = useFetchMyServiceRequests(businessId)
  const {
    data: invoices = [],
    isLoading: billingLoading,
    error: billingError,
  } = useFetchBusinessBillings(businessId)

  usePageMeta({
    title: "Dashboard",
    breadcrumbs: [{ label: "Client Portal", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
    // The request form lives on the Service Requests page.
    onRequestServiceClick: () => navigate("/client/service-requests"),
  })

  const firstName =
    user?.firstName ?? user?.user_metadata?.first_name ?? user?.name ?? ""
  const businessName = business?.businessName ?? business?.name ?? ""

  // --- Engagements -----------------------------------------------------------

  const openEngagements = useMemo(
    () =>
      engagements
        .filter((e) => OPEN_ENGAGEMENT_STATUSES.includes(e.status))
        .sort((a, b) => {
          // Earliest target date first; no date goes last.
          const da = parseDate(a.targetEndDate)
          const db = parseDate(b.targetEndDate)
          if (da && db) return da - db
          if (da) return -1
          if (db) return 1
          return 0
        }),
    [engagements]
  )

  const completedEngagements = useMemo(
    () => engagements.filter((e) => e.status === "completed"),
    [engagements]
  )

  const documentsNeeded = useMemo(
    () =>
      openEngagements.reduce((sum, e) => sum + getDocumentsNeeded(e), 0),
    [openEngagements]
  )

  // Engagement whose activity log is shown on the dashboard.
  const featuredEngagement = openEngagements[0] ?? engagements[0] ?? null
  const { data: activity = [], isLoading: activityLoading } =
    useFetchEngagementActivity(featuredEngagement?.id)

  // --- Billing ----------------------------------------------------------------

  const billing = useMemo(() => {
    const groups = { paid: [], review: [], overdue: [], open: [] }
    invoices.forEach((invoice) => {
      const bucket = classifyInvoice(invoice, today)
      if (groups[bucket]) groups[bucket].push(invoice)
    })
    const sum = (list) =>
      list.reduce((total, invoice) => total + Number(invoice.amount || 0), 0)

    const payable = [...groups.overdue, ...groups.open]
    return {
      ...groups,
      payable,
      payableTotal: sum(payable),
      reviewTotal: sum(groups.review),
    }
  }, [invoices, today])

  const upcomingPayments = useMemo(
    () =>
      [...billing.payable]
        .sort((a, b) => {
          const da = parseDate(getDueDate(a))
          const db = parseDate(getDueDate(b))
          if (da && db) return da - db
          if (da) return -1
          if (db) return 1
          return 0
        })
        .slice(0, 4),
    [billing.payable]
  )

  // --- Needs attention ---------------------------------------------------------

  const attention = useMemo(() => {
    const items = []

    invoices
      .filter((invoice) => invoice.payment_status === "rejected")
      .forEach((invoice) =>
        items.push({
          id: `rejected-${invoice.id}`,
          icon: Upload,
          tone: "bg-orange-50 text-orange-700 border-orange-200",
          title: "Payment proof was rejected",
          detail: `${invoice.id} · Upload a new proof of payment`,
          to: `/client/billing/${invoice.id}`,
        })
      )

    billing.overdue.forEach((invoice) =>
      items.push({
        id: `overdue-${invoice.id}`,
        icon: AlertTriangle,
        tone: "bg-red-50 text-red-700 border-red-200",
        title: `${invoice.billing_type ?? "Invoice"} is overdue`,
        detail: `${invoice.id} · ${formatCurrency(invoice.amount)}`,
        to: `/client/billing/${invoice.id}`,
      })
    )

    openEngagements.forEach((engagement) => {
      const count = getDocumentsNeeded(engagement)
      if (count === 0) return
      const tasksKnown =
        Array.isArray(engagement.tasks) && engagement.tasks.length > 0
      items.push({
        id: `docs-${engagement.id}`,
        icon: FileText,
        tone: "bg-amber-50 text-amber-700 border-amber-200",
        title: tasksKnown
          ? `${pluralize(count, "document")} to upload or revise`
          : "Documents needed",
        detail: `${engagement.serviceName} · Due ${formatDay(engagement.targetEndDate)}`,
        to: `/client/engagements/${engagement.id}`,
      })
    })

    return items
  }, [invoices, billing.overdue, openEngagements])

  const recentRequests = useMemo(
    () =>
      [...requests]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3),
    [requests]
  )
  const openRequestCount = requests.filter((r) =>
    OPEN_REQUEST_STATUSES.includes(r.status)
  ).length

  // --- Render -------------------------------------------------------------------

  const loading =
    authLoading ||
    businessLoading ||
    (Boolean(businessId) &&
      (engagementsLoading || requestsLoading || billingLoading))

  if (loading) return <PageSkeleton type="dashboard" />

  const loadError = engagementsError || requestsError || billingError
  const shownAttention = attention.slice(0, 5)

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {firstName ? `${greeting()}, ${firstName}` : greeting()}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {businessName
              ? `${businessName} · Here is the latest on your services and billing.`
              : "Here is the latest on your services and billing."}
          </p>
        </div>
        <Link
          to="/client/calendar"
          className={cn(
            "inline-flex w-fit items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted/40",
            focusRing
          )}
        >
          <CalendarDays className="size-3.5" aria-hidden="true" />
          Open calendar
        </Link>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Some information could not be loaded. Refresh the page to try again.
        </div>
      )}

      {/* Summary cards: each one counts a different thing, nothing is double counted */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          to="/client/engagements"
          icon={Briefcase}
          label="Active engagements"
          value={openEngagements.length}
          hint={
            completedEngagements.length
              ? `${completedEngagements.length} completed`
              : "In progress with the firm"
          }
        />
        <StatCard
          to="/client/engagements"
          icon={Upload}
          label="Documents to submit"
          value={documentsNeeded}
          tone={documentsNeeded ? "bg-amber-50 text-amber-700" : undefined}
          hint={documentsNeeded ? "Needed by the firm" : "Nothing needed from you"}
        />
        <StatCard
          to="/client/billing"
          icon={Receipt}
          label="Amount to pay"
          value={formatCurrency(billing.payableTotal)}
          tone={billing.overdue.length ? "bg-red-50 text-red-700" : undefined}
          hint={
            billing.payable.length
              ? `${pluralize(billing.payable.length, "invoice")}${
                  billing.overdue.length ? ` · ${billing.overdue.length} overdue` : ""
                }`
              : "No unpaid invoices"
          }
        />
        <StatCard
          to="/client/billing"
          icon={Hourglass}
          label="Payments under review"
          value={billing.review.length}
          tone={billing.review.length ? "bg-blue-50 text-blue-700" : undefined}
          hint={
            billing.review.length
              ? `${formatCurrency(billing.reviewTotal)} awaiting the firm`
              : "No submissions pending"
          }
        />
      </div>

      {/* Needs attention */}
      {shownAttention.length > 0 && (
        <section
          aria-labelledby="client-attention-heading"
          className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="client-attention-heading" className="text-sm font-semibold">
              Needs your attention
            </h2>
            <p className="text-xs text-muted-foreground">
              {pluralize(attention.length, "item")}
            </p>
          </div>

          <ul className="mt-3 flex flex-col gap-2">
            {shownAttention.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg border bg-background p-3 text-sm transition-colors hover:bg-muted/40",
                      focusRing
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-full border",
                          item.tone
                        )}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block break-words font-medium">
                          {item.title}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>

          {attention.length > shownAttention.length && (
            <p className="mt-2 text-xs text-muted-foreground">
              Showing {shownAttention.length} of {attention.length}.
            </p>
          )}
        </section>
      )}

      {/* Main content */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          {/* Engagements */}
          <Panel
            title="My engagements"
            description="Track the progress of your services"
            to="/client/engagements"
          >
            {openEngagements.length === 0 ? (
              <EmptyState icon={Briefcase} title="No active engagements">
                When the firm approves a service request, your engagement and its
                required documents will appear here.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {openEngagements.slice(0, 4).map((engagement) => {
                  const progress = getTaskProgress(engagement)
                  return (
                    <li key={engagement.id}>
                      <Link
                        to={`/client/engagements/${engagement.id}`}
                        className={cn(
                          "block p-4 transition-colors hover:bg-muted/40",
                          focusRing
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {engagement.serviceName}
                            </p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">
                              {engagement.engagementNumber} · Due{" "}
                              {formatDay(engagement.targetEndDate)}
                            </p>
                          </div>
                          <EngagementStatusBadge
                            status={
                              engagementStatusLabels[engagement.status] ??
                              engagement.status ??
                              "Unknown"
                            }
                          />
                        </div>

                        {progress && (
                          <div className="mt-3">
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                              <span>
                                {progress.approved} of {pluralize(progress.total, "task")}{" "}
                                approved
                              </span>
                              <span className="font-medium text-foreground">
                                {progress.percent}%
                              </span>
                            </div>
                            <ProgressBar
                              percent={progress.percent}
                              label={`${engagement.serviceName} progress`}
                            />
                          </div>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}

            {completedEngagements.length > 0 && (
              <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3 text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2
                    className="size-3.5 text-emerald-600"
                    aria-hidden="true"
                  />
                  {pluralize(completedEngagements.length, "completed engagement")}.
                  Final documents can be downloaded from each engagement.
                </span>
              </div>
            )}
          </Panel>

          {/* Service requests */}
          <Panel
            title="Service requests"
            description={
              requests.length
                ? `${openRequestCount} open · ${requests.length} total. Use Request Service at the top to start a new one.`
                : "Use Request Service at the top to start a new one."
            }
            to="/client/service-requests"
          >
            {recentRequests.length === 0 ? (
              <EmptyState icon={ClipboardList} title="No service requests yet">
                Choose a service offered by the firm and send your first request.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {recentRequests.map((request) => {
                  const meta = requestStatusMeta[request.status] ?? {
                    label: request.status,
                    tone: "bg-gray-100 text-gray-600",
                  }
                  return (
                    <li
                      key={request.id}
                      className="flex items-center justify-between gap-3 px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {request.serviceName}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {request.requestNumber} · Requested{" "}
                          {formatDay(request.createdAt)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
                          meta.tone
                        )}
                      >
                        {meta.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex min-w-0 flex-col gap-5">
          {/* Upcoming payments */}
          <Panel
            title="Upcoming payments"
            description="Unpaid invoices, earliest due date first"
            to="/client/billing"
          >
            {upcomingPayments.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="You are all caught up">
                There are no unpaid invoices right now.
              </EmptyState>
            ) : (
              <ul className="divide-y">
                {upcomingPayments.map((invoice) => {
                  const due = parseDate(getDueDate(invoice))
                  const isOverdue = classifyInvoice(invoice, today) === "overdue"
                  return (
                    <li key={invoice.id}>
                      <Link
                        to={`/client/billing/${invoice.id}`}
                        className={cn(
                          "flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40",
                          focusRing
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {invoice.billing_type ?? invoice.id}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 flex items-center gap-1 text-xs",
                              isOverdue
                                ? "font-medium text-red-700"
                                : "text-muted-foreground"
                            )}
                          >
                            {isOverdue ? (
                              <AlertTriangle className="size-3" aria-hidden="true" />
                            ) : (
                              <Clock className="size-3" aria-hidden="true" />
                            )}
                            {due
                              ? describeDueDate(due, today)
                              : "No due date set"}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold">
                          {formatCurrency(invoice.amount)}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Panel>

          {/* Latest activity */}
          <Panel
            title="Latest activity"
            description={
              featuredEngagement
                ? `Updates from the firm on ${featuredEngagement.serviceName}`
                : "Updates from the firm appear here"
            }
            to={
              featuredEngagement
                ? `/client/engagements/${featuredEngagement.id}`
                : undefined
            }
            linkLabel="Open"
          >
            {!featuredEngagement ? (
              <EmptyState icon={Clock} title="No activity yet">
                Updates will show up once you have an engagement.
              </EmptyState>
            ) : activityLoading ? (
              <p className="px-4 py-6 text-sm text-muted-foreground">
                Loading activity…
              </p>
            ) : activity.length === 0 ? (
              <EmptyState icon={Clock} title="No activity yet">
                The firm has not posted any updates for this engagement.
              </EmptyState>
            ) : (
              <div className="space-y-4 p-4">
                {activity.slice(0, 4).map((entry) => (
                  <ActivityLogItem key={entry.id} entry={entry} />
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
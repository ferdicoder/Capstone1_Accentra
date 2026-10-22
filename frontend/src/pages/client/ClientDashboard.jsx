import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Receipt,
} from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyEngagements } from "@/hooks/useEngagements"
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

const OPEN_ENGAGEMENT_STATUSES = ["pending", "active"]
// Task statuses where the client still has to upload something.
const CLIENT_TASK_STATUSES = ["missing", "for_revision"]
// Rows shown per section on the dashboard. "View all" goes to the full page.
const MAX_ROWS = 4

// Badge shown on each "Documents to Submit" row.
const documentBadges = {
  missing: { label: "Pending Submission", tone: "bg-orange-50 text-orange-700" },
  for_revision: { label: "Needs Revision", tone: "bg-red-50 text-red-700" },
  needed: { label: "Documents Needed", tone: "bg-amber-50 text-amber-700" },
}

// Badge shown on each "Outstanding Billing" row.
const billingBadges = {
  rejected: { label: "Proof Rejected", tone: "bg-orange-50 text-orange-700" },
  overdue: { label: "Overdue", tone: "bg-red-50 text-red-700" },
  open: { label: "Awaiting Payment", tone: "bg-amber-50 text-amber-700" },
  review: { label: "Under Review", tone: "bg-blue-50 text-blue-700" },
}
// Lower number = shown first.
const billingPriority = { rejected: 0, overdue: 1, open: 2, review: 3 }

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"

// --- Helpers -----------------------------------------------------------------

const getDueDate = (invoice) => invoice.dueDate ?? invoice.due_date ?? null

const humanize = (value) =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

// Known statuses use the shared labels; anything else (in_progress,
// for_payment, ...) is turned into readable text instead of showing raw values.
const getStatusLabel = (status) =>
  engagementStatusLabels[status] ?? (status ? humanize(status) : "Unknown")

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

const byDueDate = (a, b) => {
  const da = parseDate(getDueDate(a.invoice ?? a))
  const db = parseDate(getDueDate(b.invoice ?? b))
  if (da && db) return da - db
  if (da) return -1
  if (db) return 1
  return 0
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
        <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <span
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
              tone
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate">{label}</span>
        </span>
        <ArrowRight
          className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
          aria-hidden="true"
        />
      </div>
      <p className="mt-3 truncate text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>
    </Link>
  )
}

function Panel({ title, description, to, linkLabel = "View all", children }) {
  return (
    <section className="overflow-hidden rounded-xl border bg-background">
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

// Shown instead of the empty state when a request failed, so an error is never
// mistaken for "nothing to show".
function InlineError() {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 px-4 py-6 text-sm text-red-700"
    >
      <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
      This section could not be loaded. Refresh the page to try again.
    </div>
  )
}

function Badge({ tone, children }) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium",
        tone
      )}
    >
      {children}
    </span>
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

  // Newest first. Falls back to the original order when there is no date.
  const recentEngagements = useMemo(
    () =>
      [...engagements]
        .sort((a, b) => {
          const da = new Date(a.createdAt ?? a.created_at ?? 0).getTime() || 0
          const db = new Date(b.createdAt ?? b.created_at ?? 0).getTime() || 0
          return db - da
        })
        .slice(0, MAX_ROWS),
    [engagements]
  )

  // Deliverables the client can download. Counted from completed engagements
  // (final documents are downloaded from each completed engagement).
  const availableDeliverables = completedEngagements.length

  // --- Documents to submit ---------------------------------------------------
  // One row per document the client still has to provide. When the engagement
  // has no task list yet, one generic row is shown for that engagement.

  const documentItems = useMemo(() => {
    const items = []
    openEngagements.forEach((engagement) => {
      const tasks = Array.isArray(engagement.tasks) ? engagement.tasks : []
      const base = {
        engagementId: engagement.id,
        serviceName: engagement.serviceName,
        stage: getStatusLabel(engagement.status),
      }

      if (tasks.length > 0) {
        tasks
          .filter((task) => CLIENT_TASK_STATUSES.includes(task.status))
          .forEach((task, index) =>
            items.push({
              ...base,
              id: `${engagement.id}-${task.id ?? index}`,
              title:
                task.name ??
                task.title ??
                task.documentName ??
                "Document requested",
              kind: task.status,
            })
          )
      } else if (engagement.status === "active") {
        items.push({
          ...base,
          id: `${engagement.id}-needed`,
          title: "Documents needed",
          kind: "needed",
        })
      }
    })
    return items
  }, [openEngagements])

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
    }
  }, [invoices, today])

  // Billing records awaiting payment or verification, most urgent first.
  const outstandingBilling = useMemo(() => {
    const rows = []
    const add = (list, bucket) =>
      list.forEach((invoice) => {
        const kind =
          invoice.payment_status === "rejected" && bucket !== "review"
            ? "rejected"
            : bucket
        rows.push({ invoice, kind })
      })
    add(billing.overdue, "overdue")
    add(billing.open, "open")
    add(billing.review, "review")

    return rows.sort((a, b) => {
      const priority = billingPriority[a.kind] - billingPriority[b.kind]
      return priority !== 0 ? priority : byDueDate(a, b)
    })
  }, [billing])

  // --- Render -------------------------------------------------------------------

  const loading =
    authLoading ||
    businessLoading ||
    (Boolean(businessId) && (engagementsLoading || billingLoading))

  if (loading) return <PageSkeleton type="dashboard" />

  const loadError = engagementsError || billingError

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

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          to="/client/engagements"
          icon={Briefcase}
          label="Active Engagements"
          value={engagementsError ? "—" : openEngagements.length}
          hint={
            completedEngagements.length
              ? `${completedEngagements.length} completed`
              : "In progress with the firm"
          }
        />
        <StatCard
          to="/client/engagements"
          icon={FileText}
          label="Documents to Submit"
          value={engagementsError ? "—" : documentItems.length}
          tone={documentItems.length ? "bg-amber-50 text-amber-700" : undefined}
          hint={
            documentItems.length ? "Needed by the firm" : "Nothing needed from you"
          }
        />
        <StatCard
          to="/client/billing"
          icon={Receipt}
          label="Amount to Pay"
          value={billingError ? "—" : formatCurrency(billing.payableTotal)}
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
          to="/client/engagements"
          icon={Download}
          label="Available Deliverables"
          value={engagementsError ? "—" : availableDeliverables}
          tone={availableDeliverables ? "bg-emerald-50 text-emerald-700" : undefined}
          hint={
            availableDeliverables ? "Ready to download" : "None available yet"
          }
        />
      </div>

      {/* Documents to Submit */}
      <Panel
        title="Documents to Submit"
        description="Documents the client still needs to provide."
        to="/client/engagements"
      >
        {engagementsError ? (
          <InlineError />
        ) : documentItems.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing to submit">
            When the firm needs a document from you, it will appear here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {documentItems.slice(0, MAX_ROWS).map((item) => {
              const badge = documentBadges[item.kind] ?? documentBadges.needed
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <FileText className="size-4" aria-hidden="true" />
                    </span>
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <p className="break-words text-sm font-medium">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.serviceName} · {item.stage}
                      </p>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                  </div>
                  <Link
                    to={`/client/engagements/${item.engagementId}`}
                    className={cn(
                      "inline-flex w-fit shrink-0 items-center rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium hover:bg-muted/40 sm:self-end",
                      focusRing
                    )}
                  >
                    Submit Document
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {!engagementsError && documentItems.length > MAX_ROWS && (
          <p className="border-t px-4 py-3 text-xs text-muted-foreground">
            Showing {MAX_ROWS} of {documentItems.length}.
          </p>
        )}
      </Panel>

      {/* Outstanding Billing */}
      <Panel
        title="Outstanding Billing"
        description="Billing records awaiting payment or verification."
        to="/client/billing"
      >
        {billingError ? (
          <InlineError />
        ) : outstandingBilling.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="You are all caught up">
            There are no unpaid invoices right now.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {outstandingBilling.slice(0, MAX_ROWS).map(({ invoice, kind }) => {
              const badge = billingBadges[kind]
              const due = parseDate(getDueDate(invoice))
              const isUrgent = kind === "overdue" || kind === "rejected"
              return (
                <li key={invoice.id}>
                  <Link
                    to={`/client/billing/${invoice.id}`}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40",
                      focusRing
                    )}
                  >
                    <div className="flex min-w-0 flex-col gap-1.5">
                      <p className="truncate text-sm font-medium">
                        {invoice.billing_type ?? invoice.id}
                      </p>
                      <p
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isUrgent
                            ? "font-medium text-red-700"
                            : "text-muted-foreground"
                        )}
                      >
                        {isUrgent ? (
                          <AlertTriangle
                            className="size-3 shrink-0"
                            aria-hidden="true"
                          />
                        ) : (
                          <Clock className="size-3 shrink-0" aria-hidden="true" />
                        )}
                        {kind === "review"
                          ? "Payment proof submitted"
                          : kind === "rejected"
                            ? "Upload a new proof of payment"
                            : due
                              ? describeDueDate(due, today)
                              : "No due date set"}
                      </p>
                      <Badge tone={badge.tone}>{badge.label}</Badge>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(invoice.amount)}
                      </span>
                      <ChevronRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
        {!billingError && outstandingBilling.length > MAX_ROWS && (
          <p className="border-t px-4 py-3 text-xs text-muted-foreground">
            Showing {MAX_ROWS} of {outstandingBilling.length}.
          </p>
        )}
      </Panel>

      {/* Recent Engagements */}
      <Panel
        title="Recent Engagements"
        description="A quick view of current service progress."
        to="/client/engagements"
      >
        {engagementsError ? (
          <InlineError />
        ) : recentEngagements.length === 0 ? (
          <EmptyState icon={Briefcase} title="No engagements yet">
            When the firm approves a service request, your engagement will appear
            here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {recentEngagements.map((engagement) => (
              <li key={engagement.id}>
                <Link
                  to={`/client/engagements/${engagement.id}`}
                  className={cn(
                    "flex items-center justify-between gap-3 rounded-xl border p-4 transition-colors hover:bg-muted/40",
                    focusRing
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {engagement.serviceName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {getStatusLabel(engagement.status)}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  )
}
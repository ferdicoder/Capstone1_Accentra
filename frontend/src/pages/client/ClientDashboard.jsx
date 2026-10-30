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

// Badge color per engagement status (Recent Engagements rows).
const engagementStatusTones = {
  pending: "bg-blue-50 text-blue-700",
  active: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
}

const OPEN_ENGAGEMENT_STATUSES = ["pending", "active"]
// Task statuses where the client still has to upload something.
const CLIENT_TASK_STATUSES = ["missing", "for_revision"]
// Rows shown per section on the dashboard. "View all" goes to the full page.
const MAX_ROWS = 4

// Badge + icon chip shown on each "Documents to Submit" row.
const documentBadges = {
  missing: {
    label: "Pending Submission",
    tone: "bg-orange-50 text-orange-700",
  },
  for_revision: {
    label: "Needs Revision",
    tone: "bg-red-50 text-red-700",
  },
  needed: {
    label: "Documents Needed",
    tone: "bg-amber-50 text-amber-700",
  },
}

// Badge + icon chip shown on each "Outstanding Billing" row.
const billingBadges = {
  rejected: {
    label: "Proof Rejected",
    tone: "bg-orange-50 text-orange-700",
  },
  overdue: { label: "Overdue", tone: "bg-red-50 text-red-700" },
  open: { label: "Awaiting Payment", tone: "bg-amber-50 text-amber-700" },
  review: { label: "Under Review", tone: "bg-blue-50 text-blue-700" },
}
// Lower number = shown first.
const billingPriority = { rejected: 0, overdue: 1, open: 2, review: 3 }

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"

// Shared look for every clickable card inside a panel.
const rowCard =
  "group flex items-center justify-between gap-3 rounded-xl border bg-background p-4 transition-all hover:border-emerald-200 hover:bg-muted/40 hover:shadow-sm"

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

const formatShortDate = (value) => {
  const date = parseDate(value)
  return date
    ? date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null
}

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

// One bucket per invoice, so nothing is counted twice.
//   paid | review | overdue | open | "" (cancelled / refunded: not shown)
function classifyInvoice(invoice, today) {
  if (invoice.status === "paid") return "paid"
  if (["cancelled", "refunded"].includes(invoice.status)) return ""
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

// Display-only KPI card (not clickable, no icon).
function StatCard({ label, value, hint, alert = false }) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border bg-background px-5 py-4 shadow-sm">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="truncate text-2xl font-semibold leading-none tabular-nums tracking-tight">
        {value}
      </p>
      <p
        className={cn(
          "text-xs",
          alert ? "font-medium text-red-700" : "text-muted-foreground"
        )}
      >
        {hint}
      </p>
    </div>
  )
}

function Panel({
  title,
  description,
  count,
  to,
  linkLabel = "View all",
  children,
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {typeof count === "number" && count > 0 && (
              <span className="rounded-full bg-background px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-border">
                {count}
              </span>
            )}
          </div>
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

// "View N more" row at the bottom of a panel that has hidden rows.
function MoreLink({ to, count }) {
  return (
    <Link
      to={to}
      className={cn(
        "mt-auto flex items-center justify-center gap-1 border-t px-4 py-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
      )}
    >
      View {count} more
      <ArrowRight className="size-3" aria-hidden="true" />
    </Link>
  )
}

function EmptyState({ icon: Icon, title, children, positive = false }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-4 py-10 text-center">
      <div
        className={cn(
          "flex size-10 items-center justify-center rounded-full",
          positive
            ? "bg-emerald-50 text-emerald-600"
            : "bg-muted text-muted-foreground"
        )}
      >
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="mt-1 text-sm font-medium">{title}</p>
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
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        tone
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  )
}

// Small colored square holding a row's icon.
function IconChip({ icon: Icon, tone }) {
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-lg",
        tone
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
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
  const todayLabel = new Date(today).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="flex flex-1 flex-col gap-6 px-2 py-4 sm:px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {todayLabel}
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
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
            "inline-flex w-fit items-center gap-1.5 rounded-lg border bg-background px-3 py-2 text-xs font-medium shadow-sm transition-colors hover:bg-muted/40",
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

      {/* KPI cards (display only, no icons) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Engagements"
          value={engagementsError ? "—" : openEngagements.length}
          hint={
            completedEngagements.length
              ? `${completedEngagements.length} completed`
              : "In progress with the firm"
          }
        />
        <StatCard
          label="Documents to Submit"
          value={engagementsError ? "—" : documentItems.length}
          hint={
            documentItems.length ? "Needed by the firm" : "Nothing needed from you"
          }
        />
        <StatCard
          label="Amount to Pay"
          value={billingError ? "—" : formatCurrency(billing.payableTotal)}
          alert={billing.overdue.length > 0}
          hint={
            billing.payable.length
              ? `${pluralize(billing.payable.length, "invoice")}${
                  billing.overdue.length ? ` · ${billing.overdue.length} overdue` : ""
                }`
              : "No unpaid invoices"
          }
        />
      </div>

      {/* Documents to Submit (left) + Outstanding Billing (right) */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        {/* Documents to Submit */}
        <Panel
          title="Documents to Submit"
          description="Documents the client still needs to provide."
          count={engagementsError ? undefined : documentItems.length}
          to="/client/engagements"
        >
          {engagementsError ? (
            <InlineError />
          ) : documentItems.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing to submit" positive>
              When the firm needs a document from you, it will appear here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {documentItems.slice(0, MAX_ROWS).map((item) => {
                const badge = documentBadges[item.kind] ?? documentBadges.needed
                return (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-xl border bg-background p-4 transition-all hover:border-emerald-200 hover:shadow-sm xl:flex-row xl:items-center xl:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <IconChip icon={FileText} tone={badge.tone} />
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
                        "group/btn inline-flex w-fit shrink-0 items-center gap-1 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 xl:self-end",
                        focusRing
                      )}
                    >
                      Submit Document
                      <ArrowRight
                        className="size-3 transition-transform group-hover/btn:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
          {!engagementsError && documentItems.length > MAX_ROWS && (
            <MoreLink
              to="/client/engagements"
              count={documentItems.length - MAX_ROWS}
            />
          )}
        </Panel>

        {/* Outstanding Billing */}
        <Panel
          title="Outstanding Billing"
          description="Billing records awaiting payment or verification."
          count={billingError ? undefined : outstandingBilling.length}
          to="/client/billing"
        >
          {billingError ? (
            <InlineError />
          ) : outstandingBilling.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title="You are all caught up"
              positive
            >
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
                      className={cn(rowCard, focusRing)}
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <IconChip icon={Receipt} tone={badge.tone} />
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
                              <Clock
                                className="size-3 shrink-0"
                                aria-hidden="true"
                              />
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
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-semibold tabular-nums">
                          {formatCurrency(invoice.amount)}
                        </span>
                        <ChevronRight
                          className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
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
            <MoreLink
              to="/client/billing"
              count={outstandingBilling.length - MAX_ROWS}
            />
          )}
        </Panel>
      </div>

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
            {recentEngagements.map((engagement) => {
              const dueLabel = formatShortDate(engagement.targetEndDate)
              const subtitle = [
                engagement.engagementNumber,
                dueLabel ? `Due ${dueLabel}` : null,
              ]
                .filter(Boolean)
                .join(" · ")
              return (
                <li key={engagement.id}>
                  <Link
                    to={`/client/engagements/${engagement.id}`}
                    className={cn(rowCard, focusRing)}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <IconChip
                        icon={Briefcase}
                        tone="bg-emerald-50 text-emerald-700"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {engagement.serviceName}
                        </p>
                        {subtitle && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        tone={
                          engagementStatusTones[engagement.status] ??
                          "bg-slate-100 text-slate-600"
                        }
                      >
                        {getStatusLabel(engagement.status)}
                      </Badge>
                      <ChevronRight
                        className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                        aria-hidden="true"
                      />
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
import { useMemo } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Briefcase, CheckCircle2, ChevronRight } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { NoBusinessBanner } from "@/components/client/NoBusinessBanner"
import {
  Badge,
  EmptyState,
  IconChip,
  InlineError,
  ListRowAction,
  ListRowLink,
  MoreLink,
  Panel,
  StatCard,
  focusRing,
  rowCard,
} from "@/components/shared/dashboard"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyEngagements } from "@/hooks/useEngagements"
import { useFetchBusinessBillings } from "@/hooks/useBillings"
import { authStore } from "@/store/authStore"
import { classifyInvoice, getDueDate } from "@/lib/billing-status"
import { billingDisplayId } from "@/components/firm/billing/billing-variants"
import { billingTypeLabel, isEngagementActive, stageLabel, stageTone } from "@/lib/vocab"
import {
  describeDueDate,
  formatCurrency,
  parseDate,
  pluralize,
  useToday,
} from "@/lib/date-utils"

// Task statuses where the client still has to upload something.
// VERIFY: must match the task status values your API returns.
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

// --- Helpers -----------------------------------------------------------------

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

const byDueDate = (a, b) => {
  const da = parseDate(getDueDate(a.invoice ?? a))
  const db = parseDate(getDueDate(b.invoice ?? b))
  if (da && db) return da - db
  if (da) return -1
  if (db) return 1
  return 0
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
    // TODO: drive this from useNotifications (unread count) instead of true.
    hasUnreadNotifications: true,
    // The request form lives on the Service Requests page.
    onRequestServiceClick: () => navigate("/client/service-requests"),
  })

  const firstName =
    user?.firstName ?? user?.user_metadata?.first_name ?? user?.name ?? ""

  // --- Engagements -----------------------------------------------------------

  // Active = not completed and not cancelled (workflow-stages.isEngagementActive).
  const openEngagements = useMemo(
    () =>
      engagements
        .filter((e) => isEngagementActive(e.status))
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
        stage: stageLabel(engagement.status),
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
      } else if (engagement.status === "document_collection") {
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
          invoice.status === "for resubmission" && bucket !== "review"
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
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {todayLabel}
        </p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight sm:text-2xl">
          {firstName ? `${greeting()}, ${firstName}` : greeting()}
        </h1>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Some information could not be loaded. Refresh the page to try again.
        </div>
      )}

      {business === null && <NoBusinessBanner />}

      {/* KPI cards (display only, no icons) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={<span className="font-bold !text-black">Active Engagements</span>}
          value={engagementsError ? "—" : openEngagements.length}
          hint={
            completedEngagements.length
              ? `${completedEngagements.length} completed`
              : "In progress with the firm"
          }
        />
        <StatCard
          label={<span className="font-bold !text-black">Documents to Submit</span>}
          value={engagementsError ? "—" : documentItems.length}
          hint={
            documentItems.length ? "Needed by the firm" : "Nothing needed from you"
          }
        />
        <StatCard
          label={<span className="font-bold !text-black">Amount to Pay</span>}
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
        <Panel
          title="Documents to Submit"
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
                  <ListRowAction
                    key={item.id}
                    title={item.title}
                    subtitle={`${item.serviceName} · ${item.stage}`}
                    badge={badge}
                    actionLabel="Submit Document"
                    actionTo={`/client/engagements/${item.engagementId}`}
                  />
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

        <Panel
          title="Outstanding Billing"
          count={billingError ? undefined : outstandingBilling.length}
          to="/client/billing"
        >
          {billingError ? (
            <InlineError />
          ) : outstandingBilling.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="You are all caught up" positive>
              There are no unpaid invoices right now.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {outstandingBilling.slice(0, MAX_ROWS).map(({ invoice, kind }) => {
                const badge = billingBadges[kind]
                const due = parseDate(getDueDate(invoice))
                const type = invoice.billing_type ?? invoice.invoice_type
                return (
                  <ListRowLink
                    key={invoice.id}
                    to={`/client/billing/${invoice.id}`}
                    title={type ? billingTypeLabel(type) : billingDisplayId(invoice)}
                    subtitle={
                      kind === "review"
                        ? "Payment proof submitted"
                        : kind === "rejected"
                          ? "Upload a new proof of payment"
                          : due
                            ? describeDueDate(due, today)
                            : "No due date set"
                    }
                    urgent={kind === "overdue" || kind === "rejected"}
                    badge={badge}
                    trailing={formatCurrency(invoice.amount)}
                  />
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
      <Panel title="Recent Engagements" to="/client/engagements">
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
                    className={`${rowCard} ${focusRing}`}
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
                      <Badge tone={stageTone(engagement.status)}>
                        {stageLabel(engagement.status)}
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
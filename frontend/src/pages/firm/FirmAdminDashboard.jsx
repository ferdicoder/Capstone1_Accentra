import { useMemo, useState } from "react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import {
  EmptyState,
  InlineError,
  ListRowLink,
  ListRowWithActions,
  MoreLink,
  Panel,
  StatCard,
  focusRing,
} from "@/components/shared/dashboard"
// Reused as-is from the Engagements page.
import { CreateBillingDialog } from "@/components/firm/billing/create-billing-dialog"
import { isVerifiable } from "@/components/firm/billing/billing-variants"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchServiceRequests } from "@/hooks/useServiceRequests"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBillings, useCreateBilling } from "@/hooks/useBillings"
import { useFetchBusinesses } from "@/hooks/useBusinesses"
import { useFetchRecentActivity } from "@/hooks/UseRecentActivity"
import { authStore } from "@/store/authStore"
import { cn } from "@/lib/utils"
import { describeActivity } from "@/lib/activity-log"
import { classifyInvoice, getReadyToBill } from "@/lib/billing-status"
import { buildOutstandingClientSet } from "@/lib/outstanding-bill"
import { isEngagementActive, stageLabel, stageTone } from "@/lib/vocab"
import { describeDueDate, parseDate, useToday } from "@/lib/date-utils"

const BASE = "/admin"
const ROUTES = {
  requests: `${BASE}/service-requests`,
  engagements: `${BASE}/engagements`,
  engagement: (id) => `${BASE}/engagements/${id}`,
  billing: `${BASE}/billing`,
  client: (id) => `${BASE}/clients/${id}`,
}

// Rows shown per section on the dashboard. "View all" goes to the full page.
const MAX_ROWS = 4
const MAX_ACTIVITY = 10
const DUE_SOON_DAYS = 7

// ---------------------------------------------------------------------------
// FIELD MAP: the only place that knows API field names. Names marked VERIFY
// are guesses; change them here if your responses differ.
// ---------------------------------------------------------------------------
const fullName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ")

const F = {
  request: {
    isPending: (r) => r.status === "pending", // VERIFY
    serviceName: (r) => r.serviceName ?? r.service?.name ?? "Service request",
    clientName: (r) =>
      r.business?.businessName || fullName(r.client) || "Client",
    createdAt: (r) => r.createdAt ?? r.created_at ?? null,
  },
  engagement: {
    clientId: (e) => e.client?.id ?? e.clientId ?? e.client_id,
    businessId: (e) => e.business?.id ?? e.businessId,
    createdAt: (e) => e.createdAt ?? e.created_at ?? null,
    dueDate: (e) => e.targetEndDate ?? e.dueDate ?? e.due_date ?? null,
    clientName: (e) =>
      e.business?.businessName || fullName(e.client) || "Client",
  },
  billing: {
    clientId: (b) => b.client_id ?? b.clientId,
    type: (b) => b.invoice_type ?? b.billing_type, // VERIFY retainer value
    month: (b) => Number(b.billing_month),
    year: (b) => Number(b.billing_year),
  },
  client: {
    businessId: (c) => c.business?.id,
    // Id the client details route expects (/admin/clients/:id).
    // VERIFY: use the same id ClientManagementPage passes when a row is clicked.
    detailId: (c) => c.id,
    name: (c) => c.business?.businessName || fullName(c) || "Client",
    isRetainer: (c) =>
      (c.business?.clientType ?? c.clientType) === "retainer", // VERIFY
  },
}

const belongsToClient = (engagement, client) =>
  F.engagement.clientId(engagement) === client.id ||
  Boolean(
    F.engagement.businessId(engagement) &&
      F.engagement.businessId(engagement) === F.client.businessId(client)
  )

// Retainer Fee status shown on each Retainer Clients row.
const feeBadges = {
  none: { label: "Not billed", tone: "bg-amber-50 text-amber-700" },
  open: { label: "Unpaid", tone: "bg-amber-50 text-amber-700" },
  overdue: { label: "Overdue", tone: "bg-red-50 text-red-700" },
  review: { label: "For verification", tone: "bg-blue-50 text-blue-700" },
  paid: { label: "Paid", tone: "bg-emerald-50 text-emerald-700" },
}

const timeOf = (value) => parseDate(value)?.getTime() ?? null
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

export default function FirmAdminDashboard() {
  const today = useToday()
  const user = authStore((state) => state.user)
  const authLoading = authStore((state) => state.loading)

  const requestsQuery = useFetchServiceRequests()
  const engagementsQuery = useFetchEngagements({ includeTasks: false })
  const billingsQuery = useFetchBillings()
  const clientsQuery = useFetchBusinesses()
  const activityQuery = useFetchRecentActivity()
  const createBilling = useCreateBilling()

  const requests = requestsQuery.data ?? []
  const engagements = engagementsQuery.data ?? []
  const billings = billingsQuery.data ?? []
  const clients = clientsQuery.data ?? []
  const activity = activityQuery.data ?? []

  const [billDialogOpen, setBillDialogOpen] = useState(false)
  const [billClientId, setBillClientId] = useState("")
  const [notice, setNotice] = useState("")
  const [showAllClients, setShowAllClients] = useState(false)

  usePageMeta({
    title: "Dashboard",
    breadcrumbs: [{ label: "Firm Admin", href: `${BASE}/dashboard` }],
  })

  const firstName =
    user?.firstName ?? user?.user_metadata?.first_name ?? user?.name ?? ""

  const dueSoonLimit = useMemo(() => {
    const limit = new Date(today)
    limit.setDate(limit.getDate() + DUE_SOON_DAYS)
    return limit
  }, [today])

  // --- Service requests ------------------------------------------------------
  const pendingRequests = useMemo(
    () =>
      requests
        .filter(F.request.isPending)
        .sort((a, b) => (timeOf(F.request.createdAt(a)) ?? 0) - (timeOf(F.request.createdAt(b)) ?? 0)),
    [requests]
  )

  const requestAges = useMemo(() => {
    const days = pendingRequests.map((request) => {
      const created = parseDate(F.request.createdAt(request))
      return created ? Math.max(0, Math.floor((today - created) / 86400000)) : 0
    })
    return {
      today: days.filter((d) => d < 1).length,
      week: days.filter((d) => d < 7).length,
      stale: days.filter((d) => d >= 3).length,
    }
  }, [pendingRequests, today])

  // --- Engagements -----------------------------------------------------------
  const active = useMemo(
    () => engagements.filter((e) => isEngagementActive(e.status)),
    [engagements]
  )
  const stageCounts = useMemo(
    () => ({
      collecting: active.filter((e) => e.status === "document_collection").length,
      validating: active.filter((e) => e.status === "for_validation").length,
      inProgress: active.filter((e) => e.status === "in_progress").length,
    }),
    [active]
  )
  const overdue = useMemo(
    () =>
      active.filter((e) => {
        const due = parseDate(F.engagement.dueDate(e))
        return due && due < today
      }),
    [active, today]
  )
  // Overdue plus due within the next 7 days, earliest first.
  const dueSoon = useMemo(
    () =>
      active
        .filter((e) => {
          const due = parseDate(F.engagement.dueDate(e))
          return due && due <= dueSoonLimit
        })
        .sort((a, b) => (timeOf(F.engagement.dueDate(a)) ?? 0) - (timeOf(F.engagement.dueDate(b)) ?? 0)),
    [active, dueSoonLimit]
  )

  // --- Billing ---------------------------------------------------------------
  const readyToBill = useMemo(
    () => getReadyToBill(engagements, billings),
    [engagements, billings]
  )
  const billing = useMemo(() => {
    const groups = { review: [], overdue: [], open: [] }
    billings.forEach((record) => {
      if (record.status === "cancelled") return
      const bucket = isVerifiable(record)
        ? "review"
        : classifyInvoice(record, today)
      if (groups[bucket]) groups[bucket].push(record)
    })
    return { ...groups, unpaid: [...groups.overdue, ...groups.open] }
  }, [billings, today])

  // --- Clients ---------------------------------------------------------------
  const retainerClients = useMemo(() => clients.filter(F.client.isRetainer), [clients])
  const outstandingClientIds = useMemo(
    () => buildOutstandingClientSet(billings),
    [billings]
  )

  // --- Retainer Clients: monthly review -------------------------------------
  // One row per Retainer client for the current month: engagements created this
  // month, the latest engagement date, and this month's Retainer Fee status.
  // Derived only. Nothing is stored or scheduled; staff decide what to do.
  const monthLabel = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
  const retainerReview = useMemo(() => {
    const month = today.getMonth()
    const year = today.getFullYear()
    const rows = retainerClients.map((client) => {
      const mine = engagements.filter(
        (e) => e.status !== "cancelled" && belongsToClient(e, client)
      )
      const thisMonth = mine.filter((e) => {
        const created = parseDate(F.engagement.createdAt(e))
        return created && created.getMonth() === month && created.getFullYear() === year
      })
      // Keep the original date value (not a Date) so parseDate handles it as usual.
      let lastEngagement = null
      let lastTime = 0
      mine.forEach((e) => {
        const raw = F.engagement.createdAt(e)
        const time = timeOf(raw) ?? 0
        if (time > lastTime) {
          lastTime = time
          lastEngagement = raw
        }
      })
      const feeBill = billings.find(
        (b) =>
          F.billing.clientId(b) === client.id &&
          F.billing.type(b) === "retainer_fee" && // VERIFY value
          F.billing.month(b) === month + 1 &&
          F.billing.year(b) === year &&
          b.status !== "cancelled"
      )
      const feeKey = !feeBill
        ? "none"
        : isVerifiable(feeBill)
          ? "review"
          : classifyInvoice(feeBill, today) || "none"
      return {
        key: client.id,
        client,
        thisMonthCount: thisMonth.length,
        lastEngagement,
        feeKey,
        hasOutstanding: outstandingClientIds.has(client.id),
      }
    })
    // Clients with something missing first (no work yet, not billed), then by name.
    const attention = (row) =>
      (row.thisMonthCount === 0 ? 1 : 0) + (row.feeKey === "none" ? 1 : 0)
    return rows.sort(
      (a, b) =>
        attention(b) - attention(a) ||
        F.client.name(a.client).localeCompare(F.client.name(b.client))
    )
  }, [retainerClients, engagements, billings, outstandingClientIds, today])

  // Same create-billing dialog the Billing page uses. initialClientId is passed
  // for the dialog to preselect the client (ignored if it does not support it).
  const handleCreateBilling = (values) => {
    createBilling.mutate(
      { ...values, engagements: readyToBill },
      {
        onSuccess: (record) => {
          setBillDialogOpen(false)
          setNotice(`${record.id} created`)
          setTimeout(() => setNotice(""), 5000)
        },
      }
    )
  }

  const openBill = (clientId) => {
    setBillClientId(clientId)
    setBillDialogOpen(true)
  }

  // --- Render ----------------------------------------------------------------
  const loading =
    authLoading ||
    requestsQuery.isLoading ||
    engagementsQuery.isLoading ||
    billingsQuery.isLoading ||
    clientsQuery.isLoading
  if (loading) return <PageSkeleton type="dashboard" />

  const requestsError = requestsQuery.error
  const engagementsError = engagementsQuery.error
  const billingError = billingsQuery.error
  const retainerError = clientsQuery.error || engagementsError || billingError
  const loadError =
    requestsError || engagementsError || billingError || retainerError

  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const visibleClients = showAllClients
    ? retainerReview
    : retainerReview.slice(0, MAX_ROWS)

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
            What needs your attention across requests, engagements, and billing.
          </p>
        </div>
      </div>

      {notice && (
        <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
          {notice}
        </span>
      )}

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Some information could not be loaded. Refresh the page to try again.
        </div>
      )}

      {/* KPI cards: three questions an admin asks. Every card opens its page. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Pending Requests"
          value={requestsError ? "—" : pendingRequests.length}
          hint={pendingRequests.length ? "Awaiting your review" : "No pending requests"}
          breakdown={[
            { label: "New today", value: requestAges.today },
            { label: "This week", value: requestAges.week },
            { label: "Waiting 3+ days", value: requestAges.stale, alert: true },
          ]}
          to={ROUTES.requests}
        />
        <StatCard
          label="Active Engagements"
          value={engagementsError ? "—" : active.length}
          alert={overdue.length > 0}
          hint={overdue.length ? `${overdue.length} overdue` : "On track"}
          breakdown={[
            { label: "Collecting", value: stageCounts.collecting },
            { label: "Validating", value: stageCounts.validating },
            { label: "In progress", value: stageCounts.inProgress },
          ]}
          to={ROUTES.engagements}
        />
        <StatCard
          label="Billing"
          value={
            engagementsError || billingError
              ? "—"
              : readyToBill.length + billing.review.length + billing.unpaid.length
          }
          alert={billing.overdue.length > 0}
          hint={
            billing.overdue.length
              ? `${billing.overdue.length} overdue`
              : readyToBill.length + billing.review.length + billing.unpaid.length
                ? "Items need attention"
                : "All clear"
          }
          breakdown={[
            { label: "To bill", value: readyToBill.length },
            { label: "To verify", value: billing.review.length },
            { label: "Unpaid", value: billing.unpaid.length },
          ]}
          to={ROUTES.billing}
        />
      </div>

      {/* Requests awaiting review (left) + Engagement deadlines (right) */}
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:grid-rows-[auto_1fr]">
        <Panel
          title="Requests Awaiting Review"
          description="Oldest first."
          className="lg:col-start-1 lg:row-start-1"
          count={requestsError ? undefined : pendingRequests.length}
          to={ROUTES.requests}
          showLinkIcon={false}
        >
          {requestsError ? (
            <InlineError showIcon={false} />
          ) : pendingRequests.length === 0 ? (
            <EmptyState title="No pending requests" positive>
              New client requests will appear here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {pendingRequests.slice(0, MAX_ROWS).map((request) => {
                const created = parseDate(F.request.createdAt(request))
                const days = created
                  ? Math.max(0, Math.floor((today - created) / 86400000))
                  : null
                return (
                  <ListRowLink
                    key={request.id}
                    to={ROUTES.requests}
                    showChevron={false}
                    title={F.request.serviceName(request)}
                    subtitle={`${F.request.clientName(request)}${
                      days === null ? "" : ` · waiting ${days} day${days === 1 ? "" : "s"}`
                    }`}
                    badge={{ label: "Pending", tone: "bg-amber-50 text-amber-700" }}
                  />
                )
              })}
            </ul>
          )}
          {!requestsError && pendingRequests.length > MAX_ROWS && (
            <MoreLink to={ROUTES.requests} count={pendingRequests.length - MAX_ROWS} showIcon={false} />
          )}
        </Panel>

        <Panel
          title="Engagement Deadlines"
          description={`Overdue or due within ${DUE_SOON_DAYS} days, earliest first.`}
          className="lg:col-start-2 lg:row-start-1 lg:row-span-2"
          count={engagementsError ? undefined : dueSoon.length}
          to={ROUTES.engagements}
          showLinkIcon={false}
        >
          {engagementsError ? (
            <InlineError showIcon={false} />
          ) : dueSoon.length === 0 ? (
            <EmptyState title="No upcoming deadlines" positive>
              Active engagements that are late or due this week appear here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {dueSoon.slice(0, MAX_ROWS).map((engagement) => {
                const due = parseDate(F.engagement.dueDate(engagement))
                const late = due && due < today
                return (
                  <ListRowLink
                    key={engagement.id}
                    to={ROUTES.engagement(engagement.id)}
                    showChevron={false}
                    title={engagement.serviceName}
                    subtitle={`${F.engagement.clientName(engagement)} · ${describeDueDate(due, today)}`}
                    urgent={Boolean(late)}
                    badge={{
                      label: stageLabel(engagement.status),
                      tone: stageTone(engagement.status),
                    }}
                  />
                )
              })}
            </ul>
          )}
          {!engagementsError && dueSoon.length > MAX_ROWS && (
            <MoreLink to={ROUTES.engagements} count={dueSoon.length - MAX_ROWS} showIcon={false} />
          )}
        </Panel>
      {/* Retainer Clients: monthly review (derived, nothing stored or scheduled) */}
      <Panel
        title="Retainer Clients"
        description={`Monthly review for ${monthLabel}.`}
        className="lg:col-start-1 lg:row-start-2"
        count={retainerError ? undefined : retainerReview.length}
      >
        {retainerError ? (
          <InlineError showIcon={false} />
        ) : retainerReview.length === 0 ? (
          <EmptyState title="No Retainer clients yet">
            Clients converted to Retainer will appear here for the monthly review.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {visibleClients.map((row) => {
              const last = formatShortDate(row.lastEngagement)
              const badge = feeBadges[row.feeKey]
              return (
                <ListRowWithActions
                  key={row.key}
                  to={ROUTES.client(F.client.detailId(row.client))}
                  showWarningIcon={false}
                  title={F.client.name(row.client)}
                  subtitle={`${
                    row.thisMonthCount
                      ? `${row.thisMonthCount} engagement${row.thisMonthCount === 1 ? "" : "s"} this month`
                      : "No engagement yet this month"
                  }${last ? ` · last engagement ${last}` : ""}`}
                  warning={row.hasOutstanding ? "Unpaid bill" : undefined}
                  badge={{ label: `Retainer Fee: ${badge.label}`, tone: badge.tone }}
                  actions={[
                    // Only while this month's Retainer Fee bill does not exist yet.
                    ...(row.feeKey === "none"
                      ? [
                          {
                            label: "Create bill",
                            onClick: () => openBill(row.client.id),
                          },
                        ]
                      : []),
                  ]}
                />
              )
            })}
          </ul>
        )}
        {!retainerError && retainerReview.length > MAX_ROWS && (
          <button
            type="button"
            onClick={() => setShowAllClients((value) => !value)}
            className={cn(
              "mt-auto flex items-center justify-center gap-1 border-t px-4 py-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-muted/40",
              focusRing
            )}
          >
            {showAllClients
              ? "Show fewer"
              : `Show ${retainerReview.length - MAX_ROWS} more`}
          </button>
        )}
      </Panel>
      </div>

      {/* Recent activity */}
      <Panel title="Recent Activity" description="The latest actions across the firm.">
        {activityQuery.error ? (
          <InlineError showIcon={false} />
        ) : activity.length === 0 ? (
          <EmptyState title="No recent activity" compact>
            Actions on engagements, tasks, and billing will appear here.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {activity.slice(0, MAX_ACTIVITY).map((entry) => {
              const { title, description } = describeActivity(entry)
              const when = formatShortDate(entry.createdAt ?? entry.created_at)
              return (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-3 rounded-xl border bg-background p-4"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{title}</p>
                      {description && (
                        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
                      )}
                    </div>
                  </div>
                  {when && (
                    <span className="shrink-0 text-xs text-muted-foreground">{when}</span>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Panel>

      <CreateBillingDialog
        open={billDialogOpen}
        onOpenChange={setBillDialogOpen}
        onSubmit={handleCreateBilling}
        engagements={readyToBill}
        clients={clients}
        billings={billings}
        submitting={createBilling.isPending}
        error={createBilling.error?.message}
        initialEngagementId=""
        initialClientId={billClientId}
      />

    </div>
  )
}
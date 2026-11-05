import { useMemo } from "react"
import {
  Briefcase,
  CheckCircle2,
  ClipboardCheck,
  Receipt,
  Users,
} from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import {
  EmptyState,
  InlineError,
  ListRowAction,
  ListRowLink,
  MoreLink,
  Panel,
  StatCard,
} from "@/components/shared/dashboard"
import { usePageMeta } from "@/hooks/usePageMeta"
// TODO: these three firm-wide hooks must exist. Rename to your real ones.
import { useFetchBillings } from "@/hooks/useBillings"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchClients } from "@/hooks/useClients"
import { authStore } from "@/store/authStore"
import { classifyInvoice, getDueDate } from "@/lib/billing-status"
import { billingTypeLabel } from "@/lib/vocab"

import {
  useToday,
  parseDate,
  formatCurrency,
} from "@/lib/date-utils"
// ---------------------------------------------------------------------------
// FIELD MAP: the only place that knows your API field names.
// If a field is named differently in your responses, change it here.
// ---------------------------------------------------------------------------
const F = {
  invoice: {
    id: (i) => i.id,
    clientId: (i) => i.clientId ?? i.client_id,
    clientName: (i) => i.clientName ?? i.client?.name ?? "Client",
    type: (i) => i.billing_type ?? i.billingType,
    month: (i) => Number(i.billing_month ?? i.billingMonth),
    year: (i) => Number(i.billing_year ?? i.billingYear),
    // When the client submitted proof; falls back to due date for sorting.
    submittedAt: (i) =>
      i.paymentSubmittedAt ?? i.payment_submitted_at ?? getDueDate(i),
  },
  engagement: {
    id: (e) => e.id,
    // Billed = already linked to a bill (engagements.invoice_id).
    billed: (e) => Boolean(e.invoiceId ?? e.invoice_id),
    clientName: (e) => e.clientName ?? e.client?.name ?? "Client",
    completedAt: (e) => e.completedAt ?? e.completed_at ?? e.updatedAt ?? null,
    retainerCovered: (e) =>
      (e.coverageType ?? e.coverage_type) === "retainer_covered",
  },
  client: {
    id: (c) => c.id,
    name: (c) => c.name ?? c.businessName ?? "Client",
    isRetainer: (c) =>
      (c.classification ?? c.clientType ?? c.client_type) === "retainer",
    retainerCharge: (c) => c.retainerCharge ?? c.retainer_charge ?? 0,
  },
}

// Rows shown per section on the dashboard. "View all" goes to the full page.
const MAX_ROWS = 5

// TODO: confirm these routes against your firm router.
const ROUTES = {
  billing: "/firm/billing",
  readyToBill: "/firm/billing?tab=ready-to-bill",
  forVerification: "/firm/billing?status=for-verification",
  unpaid: "/firm/billing?status=unpaid",
  clients: "/firm/clients?classification=retainer",
  invoice: (id) => `/firm/billing/${id}`,
  newBillForEngagement: (id) => `/firm/billing/new?engagementId=${id}`,
  newRetainerBill: (clientId) =>
    `/firm/billing/new?type=retainer_fee&clientId=${clientId}`,
}

const coverageBadges = {
  retainer: { label: "Retainer-covered", tone: "bg-emerald-50 text-emerald-700" },
  billable: { label: "Billable", tone: "bg-amber-50 text-amber-700" },
}

const oldestFirst = (getDate) => (a, b) => {
  const da = parseDate(getDate(a))
  const db = parseDate(getDate(b))
  if (da && db) return da - db
  if (da) return -1
  if (db) return 1
  return 0
}

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function BillingOfficerDashboard() {
  const today = useToday()
  const user = authStore((state) => state.user)
  const authLoading = authStore((state) => state.loading)

  const {
    data: invoices = [],
    isLoading: billingLoading,
    error: billingError,
  } = useFetchBillings()
  const {
    data: engagements = [],
    isLoading: engagementsLoading,
    error: engagementsError,
  } = useFetchEngagements()
  const {
    data: clients = [],
    isLoading: clientsLoading,
    error: clientsError,
  } = useFetchClients()

  usePageMeta({
    title: "Dashboard",
    breadcrumbs: [{ label: "Firm Portal", href: "/firm/dashboard" }],
  })

  const firstName =
    user?.firstName ?? user?.user_metadata?.first_name ?? user?.name ?? ""

  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  const monthLabel = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  // --- Ready to Bill: completed and not yet linked to any bill ---------------
  const readyToBill = useMemo(
    () =>
      engagements
        .filter((e) => e.status === "completed" && !F.engagement.billed(e))
        .sort(oldestFirst(F.engagement.completedAt)),
    [engagements]
  )

  // --- Billing buckets (same rules as the client dashboard) -----------------
  const billing = useMemo(() => {
    const groups = { review: [], overdue: [], open: [] }
    invoices.forEach((invoice) => {
      const bucket = classifyInvoice(invoice, today)
      if (groups[bucket]) groups[bucket].push(invoice)
    })
    groups.review.sort(oldestFirst(F.invoice.submittedAt))
    return {
      ...groups,
      unpaid: [...groups.overdue, ...groups.open],
    }
  }, [invoices, today])

  // --- Retainer clients with no Retainer Fee bill for the current month ------
  const retainerNotBilled = useMemo(
    () =>
      clients
        .filter(F.client.isRetainer)
        .filter(
          (client) =>
            !invoices.some(
              (invoice) =>
                F.invoice.clientId(invoice) === F.client.id(client) &&
                F.invoice.type(invoice) === "retainer_fee" &&
                F.invoice.month(invoice) === currentMonth &&
                F.invoice.year(invoice) === currentYear &&
                // cancelled / voided bills do not count as billed
                classifyInvoice(invoice, today) !== ""
            )
        )
        .sort((a, b) => F.client.name(a).localeCompare(F.client.name(b))),
    [clients, invoices, currentMonth, currentYear, today]
  )

  // --- Render ----------------------------------------------------------------
  const loading =
    authLoading || billingLoading || engagementsLoading || clientsLoading
  if (loading) return <PageSkeleton type="dashboard" />

  const loadError = billingError || engagementsError || clientsError
  const todayLabel = today.toLocaleDateString("en-US", {
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
        <p className="mt-0.5 text-sm text-muted-foreground">
          Completed work to bill and payments to verify.
        </p>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          Some information could not be loaded. Refresh the page to try again.
        </div>
      )}

      {/* KPI cards: every card opens its filtered page */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ready to Bill"
          value={engagementsError ? "—" : readyToBill.length}
          hint={
            readyToBill.length
              ? "Completed, not yet billed"
              : "Nothing waiting to be billed"
          }
          to={ROUTES.readyToBill}
        />
        <StatCard
          label="Awaiting Verification"
          value={billingError ? "—" : billing.review.length}
          hint={
            billing.review.length
              ? "Payment proof to verify"
              : "No payments to verify"
          }
          to={ROUTES.forVerification}
        />
        <StatCard
          label="Unpaid Bills"
          value={billingError ? "—" : billing.unpaid.length}
          alert={billing.overdue.length > 0}
          hint={
            billing.overdue.length
              ? `${billing.overdue.length} overdue`
              : billing.unpaid.length
                ? "Awaiting payment"
                : "No unpaid bills"
          }
          to={ROUTES.unpaid}
        />
        <StatCard
          label="Retainer Clients Not Billed"
          value={clientsError || billingError ? "—" : retainerNotBilled.length}
          hint={`No bill for ${monthLabel}`}
          to={ROUTES.clients}
        />
      </div>

      {/* Ready to Bill queue (left) + Verification queue (right) */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Panel
          title="Ready to Bill"
          description="Completed engagements waiting for a bill, oldest first."
          count={engagementsError ? undefined : readyToBill.length}
          to={ROUTES.readyToBill}
        >
          {engagementsError ? (
            <InlineError />
          ) : readyToBill.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Nothing to bill" positive>
              Completed engagements appear here until a bill is created.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {readyToBill.slice(0, MAX_ROWS).map((engagement) => {
                const id = F.engagement.id(engagement)
                const badge = F.engagement.retainerCovered(engagement)
                  ? coverageBadges.retainer
                  : coverageBadges.billable
                return (
                  <ListRowAction
                    key={id}
                    icon={Briefcase}
                    iconTone={badge.tone}
                    title={engagement.serviceName}
                    subtitle={F.engagement.clientName(engagement)}
                    badge={badge}
                    actionLabel="Create bill"
                    actionTo={ROUTES.newBillForEngagement(id)}
                  />
                )
              })}
            </ul>
          )}
          {!engagementsError && readyToBill.length > MAX_ROWS && (
            <MoreLink
              to={ROUTES.readyToBill}
              count={readyToBill.length - MAX_ROWS}
            />
          )}
        </Panel>

        <Panel
          title="Payments to Verify"
          description="Payment proof submitted by clients, oldest first."
          count={billingError ? undefined : billing.review.length}
          to={ROUTES.forVerification}
        >
          {billingError ? (
            <InlineError />
          ) : billing.review.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No payments to verify" positive>
              When a client submits payment proof, it will appear here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 p-4">
              {billing.review.slice(0, MAX_ROWS).map((invoice) => (
                <ListRowLink
                  key={F.invoice.id(invoice)}
                  to={ROUTES.invoice(F.invoice.id(invoice))}
                  icon={Receipt}
                  iconTone="bg-blue-50 text-blue-700"
                  title={`${billingTypeLabel(F.invoice.type(invoice))} · ${F.invoice.clientName(invoice)}`}
                  subtitle="Payment proof submitted"
                  badge={{ label: "Under Review", tone: "bg-blue-50 text-blue-700" }}
                  trailing={formatCurrency(invoice.amount)}
                />
              ))}
            </ul>
          )}
          {!billingError && billing.review.length > MAX_ROWS && (
            <MoreLink
              to={ROUTES.forVerification}
              count={billing.review.length - MAX_ROWS}
            />
          )}
        </Panel>
      </div>

      {/* Retainer clients without this month's bill */}
      <Panel
        title="Retainer Clients Not Billed This Month"
        description={`Retainer clients with no Retainer Fee bill for ${monthLabel}.`}
        count={clientsError || billingError ? undefined : retainerNotBilled.length}
        to={ROUTES.clients}
      >
        {clientsError || billingError ? (
          <InlineError />
        ) : retainerNotBilled.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="All retainer clients are billed" positive>
            Every Retainer client has a bill for {monthLabel}.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-3 p-4">
            {retainerNotBilled.slice(0, MAX_ROWS).map((client) => (
              <ListRowAction
                key={F.client.id(client)}
                icon={Users}
                iconTone="bg-emerald-50 text-emerald-700"
                title={F.client.name(client)}
                subtitle={`Retainer Charge ${formatCurrency(F.client.retainerCharge(client))}`}
                actionLabel="Create Retainer Fee bill"
                actionTo={ROUTES.newRetainerBill(F.client.id(client))}
              />
            ))}
          </ul>
        )}
        {!(clientsError || billingError) && retainerNotBilled.length > MAX_ROWS && (
          <MoreLink
            to={ROUTES.clients}
            count={retainerNotBilled.length - MAX_ROWS}
          />
        )}
      </Panel>
    </div>
  )
}

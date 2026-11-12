import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
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
import { CreateBillingDialog } from "@/components/firm/billing/create-billing-dialog"
import { billingDisplayId } from "@/components/firm/billing/billing-variants"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useCreateBilling, useFetchBillings } from "@/hooks/useBillings"
import { useFetchEngagements } from "@/hooks/useEngagements"
// Retainer clients must come from the `businesses` table (type + retainer_fee).
// useFetchClients() derives clients from engagements/service requests and never
// carries the stored classification or retainer fee, so it cannot answer
// "is this retainer client billed for the month?".
import { useFetchBusinesses } from "@/hooks/useBusinesses"
import { authStore } from "@/store/authStore"
import { classifyInvoice, getDueDate, getReadyToBill } from "@/lib/billing-status"
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
// Owner's personal name. Only used when the business record has no name of its
// own — it is never presented as the business name.
const fullName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(" ")

const F = {
  invoice: {
    id: (i) => i.id,
    // Billing rows are keyed by their business (client) id.
    clientId: (i) => i.business_id ?? i.clientId ?? i.client_id,
    clientName: (i) => i.businessName ?? i.clientName ?? i.client?.name ?? null,
    type: (i) => i.billing_type ?? i.billingType,
    month: (i) => Number(i.billing_month ?? i.billingMonth),
    year: (i) => Number(i.billing_year ?? i.billingYear),
    // When the client submitted proof; falls back to due date for sorting.
    submittedAt: (i) =>
      i.paymentSubmittedAt ?? i.payment_submitted_at ?? getDueDate(i),
  },
  engagement: {
    id: (e) => e.id,
    // Mapped engagements carry the business name and the owner's names.
    clientName: (e) =>
      e.clientName ||
      e.business?.businessName ||
      e.client?.name ||
      fullName(e.client) ||
      "Client",
    // The API exposes no completion timestamp (ENGAGEMENT_BASE_SELECT returns
    // start_date, due_date and created_at only), so the queue is ordered by
    // when the engagement was created — oldest first.
    createdAt: (e) => e.createdAt ?? e.created_at ?? null,
    // Coverage lives on the service, mapped to `isRetainerCovered`.
    retainerCovered: (e) => e.isRetainerCovered === true,
  },
  client: {
    id: (c) => c.id,
    // `businesses.name` is blank on some legacy rows, so fall back to the
    // owner's name instead of rendering an empty title.
    name: (c) => c.name || c.businessName || fullName(c) || "Client",
    isRetainer: (c) =>
      (c.classification ?? c.clientType ?? c.client_type) === "retainer",
    retainerCharge: (c) =>
      c.retainerFee ?? c.retainerCharge ?? c.retainer_charge ?? 0,
  },
}

// Rows shown per section on the dashboard. "View all" goes to the full page.
const MAX_ROWS = 5

// The dashboard lives in both the /firm and /billing-officer trees, and each
// tree only allows its own roles — build links from the tree we are mounted in.
const buildRoutes = (basePath) => ({
  billing: `${basePath}/billing`,
  readyToBill: `${basePath}/billing?tab=ready-to-bill`,
  forVerification: `${basePath}/billing?status=for-verification`,
  unpaid: `${basePath}/billing?status=unpaid`,
  clients: `${basePath}/clients?classification=retainer`,
  invoice: (id) => `${basePath}/billing/${id}`,
})

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

// Full timestamps, not parseDate's day precision: engagements created on the
// same day must still come out oldest first, so the engagement code breaks ties.
const oldestCreatedFirst = (a, b) => {
  const ta = Date.parse(F.engagement.createdAt(a))
  const tb = Date.parse(F.engagement.createdAt(b))
  const fa = Number.isNaN(ta)
  const fb = Number.isNaN(tb)
  if (fa && fb) return String(a.id).localeCompare(String(b.id))
  if (fa) return 1
  if (fb) return -1
  return ta - tb || String(a.id).localeCompare(String(b.id))
}

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default function BillingOfficerDashboard() {
  const today = useToday()
  const location = useLocation()
  const navigate = useNavigate()
  const user = authStore((state) => state.user)
  const authLoading = authStore((state) => state.loading)
  const basePath = location.pathname.startsWith("/billing-officer")
    ? "/billing-officer"
    : "/firm"
  const ROUTES = useMemo(
    () => buildRoutes(basePath),
    [basePath]
  )

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
  } = useFetchBusinesses()

  // Bill creation happens in a dialog here (there is no /billing/new route).
  // The clicked row only tells it which engagement or client to preselect.
  const createBilling = useCreateBilling()
  const [billingTarget, setBillingTarget] = useState(null)

  usePageMeta({
    title: "Dashboard",
    breadcrumbs: [],
  })

  const firstName =
    user?.firstName ?? user?.user_metadata?.first_name ?? user?.name ?? ""

  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()
  const monthLabel = today.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  // --- Ready to Bill: completed and not linked to any active bill ------------
  // Bill links live in `billing_engagements`, not on the engagement row, so the
  // billed set is derived from the bills themselves (same rule as the admin
  // dashboard). Paid and pending bills both count as billed.
  const readyToBill = useMemo(
    () =>
      getReadyToBill(engagements, invoices).sort(oldestCreatedFirst),
    [engagements, invoices]
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

  // DB business names by id, so the verification queue can show real clients.
  const clientNames = useMemo(
    () => new Map(clients.map((client) => [F.client.id(client), F.client.name(client)])),
    [clients]
  )
  const invoiceClientName = (invoice) =>
    F.invoice.clientName(invoice) ??
    clientNames.get(F.invoice.clientId(invoice)) ??
    "Client"

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

  // The dialog only bills completed engagements, same as the billing page.
  const billingEngagements = useMemo(
    () => engagements.filter((engagement) => engagement.status === "completed"),
    [engagements]
  )

  const handleCreateBilling = (values) => {
    createBilling.mutate(
      { ...values, engagements: billingEngagements },
      {
        onSuccess: (record) => {
          setBillingTarget(null)
          navigate(ROUTES.billing, {
            state: { notice: `${billingDisplayId(record)} created` },
          })
        },
      }
    )
  }

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
          description="Completed engagements waiting for a bill, oldest created first."
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
                    onAction={() => setBillingTarget({ engagementId: id })}
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
                  title={`${billingTypeLabel(F.invoice.type(invoice))} · ${invoiceClientName(invoice)}`}
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
                onAction={() => setBillingTarget({ clientId: F.client.id(client) })}
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

      <CreateBillingDialog
        open={Boolean(billingTarget)}
        onOpenChange={(open) => {
          if (!open) setBillingTarget(null)
        }}
        onSubmit={handleCreateBilling}
        engagements={billingEngagements}
        clients={clients}
        billings={invoices}
        submitting={createBilling.isPending}
        error={createBilling.error?.message}
        initialEngagementId={billingTarget?.engagementId ?? ""}
        initialClientId={billingTarget?.clientId ?? ""}
      />
    </div>
  )
}

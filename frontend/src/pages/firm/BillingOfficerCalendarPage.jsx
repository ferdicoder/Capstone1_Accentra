import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Hourglass,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchBillings, useUpdatePaymentStatus } from "@/hooks/useBillings"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBusinesses } from "@/hooks/useBusinesses"

// Billing components. If Vite can't resolve these, use Ctrl+P in VS Code to
// find the real folder (see the note below the code).
import { VerifyPaymentDialog } from "@/components/firm/billing/verify-payment-dialog"
import { RejectPaymentDialog } from "@/components/firm/billing/reject-payment-dialog"
import {
  formatPeso,
  invoiceTypeLabels,
} from "@/components/firm/billing/billing-variants"

// Same shared calendar engine the Client calendar uses.
import { EventCalendar } from "@/pages/client/ClientBillingCalendar/event-calendar"
import {
  DAY_FORMAT,
  MONTH_NAMES,
  describeDueDate,
  parseDate,
  pluralize,
  toKey,
  useToday,
} from "@/pages/client/ClientBillingCalendar/calendar-utils"
import { cn } from "@/lib/utils"

const BASE_PATH = "/billing-officer"

// Key order is also the sort order within a day. "verifying" is first on
// purpose: clearing the verification queue is the Billing Officer's core job.
const EVENT_TYPES = {
  verifying: {
    label: "Payment under review",
    icon: Hourglass,
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  overdue: {
    label: "Overdue",
    icon: AlertTriangle,
    chip: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  due_today: {
    label: "Due today",
    icon: Clock,
    chip: "bg-orange-50 text-orange-700 border-orange-200",
    dot: "bg-orange-500",
  },
  upcoming: {
    label: "Upcoming",
    icon: CalendarClock,
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
}

// The mock data uses "unpaid" / "for_verification" / "paid" while
// billing-variants.js uses "pending" / "paid" / ... This page accepts both.
// "pending" and "unpaid" both mean "not paid yet".
const PAID_STATUSES = ["paid"]
const CLOSED_STATUSES = ["cancelled", "refunded"]

const isTrackedStatus = (billing) =>
  !CLOSED_STATUSES.includes(billing.status)

const getPendingPayment = (billing) =>
  billing.payments?.find((payment) => payment.status === "pending") ?? null

// A bill is "under review" only when a payment was actually submitted.
// NOT when status === "pending", because "pending" also means "unpaid".
const needsReview = (billing) =>
  billing?.status === "for_verification" || Boolean(getPendingPayment(billing))

function resolveClientName(client, engagement) {
  const person = client ?? engagement?.client
  const personName = [person?.firstName, person?.lastName]
    .filter(Boolean)
    .join(" ")
  return (
    personName ||
    client?.businessName ||
    client?.business?.businessName ||
    engagement?.business?.businessName ||
    "Unknown client"
  )
}

function buildEvents({ billings, engagements, clients, today }) {
  const engagementById = new Map(
    engagements.map((engagement) => [String(engagement.id), engagement])
  )
  const clientById = new Map(clients.map((client) => [String(client.id), client]))
  const todayKey = toKey(today)
  const events = []

  for (const billing of billings) {
    if (!isTrackedStatus(billing)) continue
    const isPaid = PAID_STATUSES.includes(billing.status)

    const dueDate = parseDate(billing.due_date)
    if (!dueDate) continue // never invent dates

    const isRetainer = billing.invoice_type === "retainer_fee"
    const engagement = engagementById.get(String(billing.engagement_id))
    const client = clientById.get(String(billing.client_id ?? billing.business_id))
    const clientName = resolveClientName(client, engagement)
    const serviceName = engagement?.serviceName

    let title = invoiceTypeLabels[billing.invoice_type] ?? "Service Fee"
    if (isRetainer) {
      const monthName = MONTH_NAMES[billing.billing_month - 1]
      title =
        monthName && billing.billing_year
          ? `Retainer Fee — ${monthName} ${billing.billing_year}`
          : "Retainer Fee"
    } else if (serviceName) {
      title = `Service Fee — ${serviceName}`
    }

    const reference = billing.payment_reference || billing.id
    const serviceGroup = isRetainer
      ? "Retainer fees"
      : (serviceName ?? "Other services")
    const paidDate = isPaid
      ? parseDate(billing.paid_at ?? billing.payment_date)
      : null

    let type
    let date = dueDate
    let description

    if (isPaid) {
      type = "paid"
      date = paidDate ?? dueDate
      description = paidDate
        ? "Payment recorded by the firm"
        : "Paid (shown on its due date)"
    } else if (needsReview(billing)) {
      type = "verifying"
      const pending = getPendingPayment(billing)
      date = parseDate(pending?.created_at ?? pending?.submitted_at) ?? dueDate
      description = `${clientName} submitted a payment — needs your review`
    } else if (billing.status === "overdue" || toKey(dueDate) < todayKey) {
      type = "overdue"
      description =
        toKey(dueDate) < todayKey
          ? describeDueDate(dueDate, today)
          : "Marked overdue by the firm"
    } else if (toKey(dueDate) === todayKey) {
      type = "due_today"
      description = "Due today"
    } else {
      type = "upcoming"
      description = describeDueDate(dueDate, today)
    }

    events.push({
      id: `billing-${billing.id}`,
      type,
      date,
      title,
      description,
      amount: Number(billing.amount) || 0,
      reference,
      href: `${BASE_PATH}/billing/${billing.id}`,
      linkLabel: "Details",
      searchText: [reference, clientName, serviceGroup, billing.description]
        .filter(Boolean)
        .join(" "),
      clientName,
      serviceGroup,
      billing,
      dueDate,
      paidDate,
      isRetainer,
    })
  }

  return events
}

// Cards count ALL billing records (not just the visible month).
function getSummaryItems(_monthEvents, allEvents) {
  const pick = (type) => {
    const list = allEvents.filter((event) => event.type === type)
    return {
      count: list.length,
      total: list.reduce((sum, event) => sum + event.amount, 0),
    }
  }

  const verifying = pick("verifying")
  const dueToday = pick("due_today")
  const overdue = pick("overdue")
  const paid = pick("paid")

  return [
    {
      label: "Payments to verify",
      filterType: "verifying",
      value: verifying.count,
      valueClass: verifying.count ? "text-blue-700" : undefined,
      hint: verifying.count ? formatPeso(verifying.total) : "Queue is empty",
    },
    {
      label: "Due today",
      filterType: "due_today",
      value: dueToday.count,
      hint: dueToday.count ? formatPeso(dueToday.total) : "Nothing due today",
    },
    {
      label: "Overdue payments",
      filterType: "overdue",
      value: overdue.count,
      valueClass: overdue.count ? "text-red-700" : undefined,
      hint: overdue.count ? formatPeso(overdue.total) : "None overdue",
    },
    {
      label: "Paid bills",
      filterType: "paid",
      value: paid.count,
      hint: paid.count ? formatPeso(paid.total) : "None recorded",
    },
  ]
}

function AttentionPanel({ events, onOpen }) {
  const urgent = events
    .filter(
      (event) =>
        event.type === "verifying" ||
        event.type === "overdue" ||
        event.type === "due_today"
    )
    .sort((a, b) => {
      const rank = { verifying: 0, overdue: 1, due_today: 2 }
      if (rank[a.type] !== rank[b.type]) return rank[a.type] - rank[b.type]
      return a.dueDate - b.dueDate
    })

  if (urgent.length === 0) return null

  const total = urgent.reduce((sum, event) => sum + event.amount, 0)
  const shown = urgent.slice(0, 5)

  return (
    <section
      aria-labelledby="attention-heading"
      className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="attention-heading" className="text-sm font-semibold">
          Needs your attention
        </h2>
        <p className="text-xs text-muted-foreground">
          {pluralize(urgent.length, "bill")} · {formatPeso(total)}
        </p>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {shown.map((event) => {
          const config = EVENT_TYPES[event.type]
          const Icon = config.icon
          return (
            <li key={event.id}>
              <button
                type="button"
                onClick={() => onOpen(event)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background p-3 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border",
                      config.chip
                    )}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block break-words font-medium">
                      {event.clientName} — {event.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {config.label} · {event.description}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatPeso(event.amount)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {urgent.length > shown.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {shown.length} of {urgent.length}. Select the Payments to
          verify, Overdue, or Due today card below to see them all.
        </p>
      )}
    </section>
  )
}

function DetailRow({ label, children }) {
  if (children == null || children === "") return null
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="break-words text-right font-medium">{children}</dd>
    </div>
  )
}

function BillingEventDialog({ event, today, onClose, onViewBilling, onVerify }) {
  const billing = event?.billing
  const config = event ? EVENT_TYPES[event.type] : null
  const Icon = config?.icon

  const issueDate = parseDate(billing?.issue_date ?? billing?.issued_at)
  const notes = billing?.notes ?? billing?.remarks
  const isUnpaid = event && event.type !== "paid"
  const canVerify = event?.type === "verifying"

  return (
    <Dialog open={Boolean(event)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        {event && (
          <>
            <DialogHeader>
              <DialogTitle>{event.title}</DialogTitle>
              <DialogDescription>{event.description}</DialogDescription>
            </DialogHeader>

            <dl className="divide-y">
              <DetailRow label="Status">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
                    config?.chip
                  )}
                >
                  {Icon && <Icon className="size-3" aria-hidden="true" />}
                  {config?.label}
                </span>
              </DetailRow>
              <DetailRow label="Client">{event.clientName}</DetailRow>
              <DetailRow label="Reference">{event.reference}</DetailRow>
              <DetailRow label="Service">
                {event.isRetainer ? "Retainer fee" : event.serviceGroup}
              </DetailRow>
              <DetailRow label="Description">{billing?.description}</DetailRow>
              <DetailRow label="Amount">{formatPeso(event.amount)}</DetailRow>
              <DetailRow label="Issue date">
                {issueDate ? DAY_FORMAT.format(issueDate) : null}
              </DetailRow>
              <DetailRow label="Due date">
                {DAY_FORMAT.format(event.dueDate)}
                {isUnpaid && (
                  <span className="block text-xs font-normal text-muted-foreground">
                    {describeDueDate(event.dueDate, today)}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Payment date">
                {event.paidDate ? DAY_FORMAT.format(event.paidDate) : null}
              </DetailRow>
              <DetailRow label="Notes">{notes}</DetailRow>
            </dl>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              {canVerify && (
                <Button
                  className="gap-1.5 bg-blue-600 text-white hover:opacity-90"
                  onClick={() => onVerify(event)}
                >
                  Verify payment
                </Button>
              )}
              <Button onClick={() => onViewBilling(event)}>
                View billing details
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default function BillingOfficerCalendarPage() {
  const navigate = useNavigate()
  const today = useToday()

  const {
    data: billings = [],
    isLoading,
    error,
    refetch,
  } = useFetchBillings()
  const { data: engagements = [] } = useFetchEngagements({ includeTasks: false })
  const { data: clients = [] } = useFetchBusinesses()
  const updatePayment = useUpdatePaymentStatus()

  const [client, setClient] = useState("all")
  const [service, setService] = useState("all")
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [verifyingEvent, setVerifyingEvent] = useState(null)
  const [rejectingEvent, setRejectingEvent] = useState(null)
  const [notice, setNotice] = useState("")

  usePageMeta({
    title: "Billing Calendar",
    breadcrumbs: [{ label: "Billing Officer", href: `${BASE_PATH}/dashboard` }],
  })

  const allEvents = useMemo(
    () => buildEvents({ billings, engagements, clients, today }),
    [billings, engagements, clients, today]
  )

  const missingDueDateCount = useMemo(
    () =>
      billings.filter(
        (billing) => isTrackedStatus(billing) && !parseDate(billing.due_date)
      ).length,
    [billings]
  )

  const clientOptions = useMemo(
    () => [...new Set(allEvents.map((event) => event.clientName))].sort(),
    [allEvents]
  )
  const serviceOptions = useMemo(
    () => [...new Set(allEvents.map((event) => event.serviceGroup))].sort(),
    [allEvents]
  )

  const events = useMemo(
    () =>
      allEvents.filter(
        (event) =>
          (client === "all" || event.clientName === client) &&
          (service === "all" || event.serviceGroup === service)
      ),
    [allEvents, client, service]
  )

  const showNotice = (message) => {
    setNotice(message)
    setTimeout(() => setNotice(""), 3000)
  }

  // VerifyPaymentDialog's onConfirm signature: (paymentMethod, referenceId).
  const handleConfirmVerification = (paymentMethod, referenceId) => {
    const billing = verifyingEvent?.billing
    if (!billing || !paymentMethod) return
    if (paymentMethod !== "cash" && !referenceId) return

    const payment = getPendingPayment(billing)
    if (!payment) {
      showNotice("No pending payment found for this bill")
      return
    }

    updatePayment.mutate(
      {
        paymentId: payment.payment_id,
        billingId: billing.id,
        status: "verified",
        referenceId,
      },
      {
        onSuccess: () => {
          setVerifyingEvent(null)
          setSelectedEvent(null)
          showNotice(`${billing.id} payment verified`)
          refetch?.()
        },
        onError: (err) => showNotice(err.message),
      }
    )
  }

  // RejectPaymentDialog is its own dialog, opened from VerifyPaymentDialog.
  const handleOpenReject = () => {
    if (!verifyingEvent) return
    setRejectingEvent(verifyingEvent)
    setVerifyingEvent(null)
  }

  const handleConfirmRejection = () => {
    const billing = rejectingEvent?.billing
    if (!billing) return

    const payment = getPendingPayment(billing)
    if (!payment) {
      showNotice("No pending payment found for this bill")
      return
    }

    updatePayment.mutate(
      { paymentId: payment.payment_id, billingId: billing.id, status: "rejected" },
      {
        onSuccess: () => {
          setRejectingEvent(null)
          setSelectedEvent(null)
          showNotice(`${billing.id} payment rejected`)
          refetch?.()
        },
        onError: (err) => showNotice(err.message),
      }
    )
  }

  const clientFilter =
    clientOptions.length > 1 ? (
      <div className="flex items-center gap-2">
        <label
          htmlFor="billing-officer-client-filter"
          className="text-sm text-muted-foreground"
        >
          Client
        </label>
        <select
          id="billing-officer-client-filter"
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="h-9 min-w-0 max-w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <option value="all">All clients</option>
          {clientOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    ) : null

  const serviceFilter =
    serviceOptions.length > 1 ? (
      <div className="flex items-center gap-2">
        <label
          htmlFor="billing-officer-service-filter"
          className="text-sm text-muted-foreground"
        >
          Service
        </label>
        <select
          id="billing-officer-service-filter"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="h-9 min-w-0 max-w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <option value="all">All services</option>
          {serviceOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    ) : null

  const toolbarExtras =
    clientFilter || serviceFilter ? (
      <>
        {clientFilter}
        {serviceFilter}
      </>
    ) : null

  const noticeArea = (
    <>
      {notice && (
        <span className="inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
          {notice}
        </span>
      )}
      <AttentionPanel events={events} onOpen={setSelectedEvent} />
      {missingDueDateCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {pluralize(missingDueDateCount, "billing record")} without a due date{" "}
          {missingDueDateCount === 1 ? "isn’t" : "aren’t"} shown here.
        </p>
      )}
    </>
  )

  return (
    <>
      <EventCalendar
        events={events}
        eventTypes={EVENT_TYPES}
        title="Billing Calendar"
        description="Review every client's upcoming due dates, overdue bills, and payments waiting on your verification."
        summaryItems={getSummaryItems}
        summaryCaption="All billing records, firm-wide"
        onOpenEvent={setSelectedEvent}
        emptyMessage="No billing dates on this day."
        emptyTitle="No billing records yet"
        emptyDescription="Once a firm issues an invoice, its due date and payment status will appear here."
        loading={isLoading}
        error={error}
        onRetry={refetch ? () => refetch() : undefined}
        searchable
        searchPlaceholder="Search by client, service, or invoice"
        toolbarExtras={toolbarExtras}
        notice={noticeArea}
        externalFiltersActive={client !== "all" || service !== "all"}
        onClearExternalFilters={() => {
          setClient("all")
          setService("all")
        }}
      />

      <BillingEventDialog
        event={selectedEvent}
        today={today}
        onClose={() => setSelectedEvent(null)}
        onViewBilling={(event) => navigate(event.href)}
        onVerify={(event) => setVerifyingEvent(event)}
      />

      <VerifyPaymentDialog
        billing={verifyingEvent?.billing}
        open={Boolean(verifyingEvent)}
        onOpenChange={(open) => !open && setVerifyingEvent(null)}
        onConfirm={handleConfirmVerification}
        onReject={handleOpenReject}
        submitting={updatePayment.isPending}
      />

      <RejectPaymentDialog
        billing={rejectingEvent?.billing}
        open={Boolean(rejectingEvent)}
        onOpenChange={(open) => !open && setRejectingEvent(null)}
        onConfirm={handleConfirmRejection}
        submitting={updatePayment.isPending}
      />
    </>
  )
}
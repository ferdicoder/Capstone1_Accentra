import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
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
import { useFetchBillings } from "@/hooks/useBillings"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { EventCalendar } from "./event-calendar"
import {
  DAY_FORMAT,
  MONTH_NAMES,
  describeDueDate,
  formatCurrency,
  parseDate,
  pluralize,
  toKey,
  useToday,
} from "./calendar-utils"
import { cn } from "@/lib/utils"

const BASE_PATH = "/client"

// Key order is also the sort order within a day.
// Every status has an icon, so color is never the only signal.
const EVENT_TYPES = {
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
  verifying: {
    label: "Payment under review",
    icon: Hourglass,
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  paid: {
    label: "Paid",
    icon: CheckCircle2,
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
}

const UNPAID_STATUSES = ["unpaid", "pending", "overdue", "for_verification"]
const PAID_STATUSES = ["paid"]
const ALL_SERVICES = "all"
const RETAINER_GROUP = "Retainer fees"

const isTrackedStatus = (status) =>
  PAID_STATUSES.includes(status) || UNPAID_STATUSES.includes(status)

const getPendingPayment = (billing) =>
  billing.payments?.find((payment) => payment.status === "pending") ?? null

function buildEvents({ billings, engagements, today }) {
  const engagementById = new Map(
    engagements.map((engagement) => [String(engagement.id), engagement])
  )
  const todayKey = toKey(today)
  const events = []

  for (const billing of billings) {
    if (!isTrackedStatus(billing.status)) continue
    const isPaid = PAID_STATUSES.includes(billing.status)

    const dueDate = parseDate(billing.due_date)
    if (!dueDate) continue // never invent dates

    const isRetainer = billing.invoice_type === "retainer_fee"
    const engagement = engagementById.get(String(billing.engagement_id))
    const serviceName = engagement?.serviceName

    let title = "Service Fee"
    if (isRetainer) {
      const monthName = MONTH_NAMES[billing.billing_month - 1]
      title =
        monthName && billing.billing_year
          ? `Retainer Fee — ${monthName} ${billing.billing_year}`
          : "Retainer Fee"
    } else if (serviceName) {
      title = `Service Fee — ${serviceName}`
    }

    const reference = billing.invoice_number ?? `Invoice #${billing.id}`
    const group = isRetainer ? RETAINER_GROUP : (serviceName ?? "Other services")
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
    } else {
      const pending = getPendingPayment(billing)
      if (billing.status === "for_verification" || pending) {
        type = "verifying"
        date =
          parseDate(pending?.created_at ?? pending?.submitted_at) ?? dueDate
        description = "Payment submitted, waiting for the firm to confirm"
      } else if (billing.status === "overdue" || toKey(dueDate) < todayKey) {
        type = "overdue"
        description =
          toKey(dueDate) < todayKey
            ? describeDueDate(dueDate, today)
            : "Marked overdue by your firm"
      } else if (toKey(dueDate) === todayKey) {
        type = "due_today"
        description = "Due today"
      } else {
        type = "upcoming"
        description = describeDueDate(dueDate, today)
      }
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
      searchText: [reference, group, billing.description]
        .filter(Boolean)
        .join(" "),
      group,
      billing,
      dueDate,
      paidDate,
      isRetainer,
    })
  }

  return events
}

// Cards count ALL billing records (not just the visible month), so "Overdue"
// still shows a bill that was due in an earlier month. Clicking a card filters
// the calendar to that status.
function getSummaryItems(_monthEvents, allEvents) {
  const pick = (type) => {
    const list = allEvents.filter((event) => event.type === type)
    return {
      count: list.length,
      total: list.reduce((sum, event) => sum + event.amount, 0),
    }
  }

  const upcoming = pick("upcoming")
  const dueToday = pick("due_today")
  const overdue = pick("overdue")
  const paid = pick("paid")

  return [
    {
      label: "Upcoming payments",
      filterType: "upcoming",
      value: upcoming.count,
      hint: upcoming.count ? formatCurrency(upcoming.total) : "None scheduled",
    },
    {
      label: "Due today",
      filterType: "due_today",
      value: dueToday.count,
      hint: dueToday.count ? formatCurrency(dueToday.total) : "Nothing due today",
    },
    {
      label: "Overdue payments",
      filterType: "overdue",
      value: overdue.count,
      valueClass: overdue.count ? "text-red-700" : undefined,
      hint: overdue.count ? formatCurrency(overdue.total) : "None overdue",
    },
    {
      label: "Paid bills",
      filterType: "paid",
      value: paid.count,
      hint: paid.count ? formatCurrency(paid.total) : "None recorded",
    },
  ]
}

// Pinned above the calendar so an overdue bill never disappears when the
// client browses another month.
function AttentionPanel({ events, onOpen }) {
  const urgent = events
    .filter((event) => event.type === "overdue" || event.type === "due_today")
    .sort((a, b) => a.dueDate - b.dueDate)

  if (urgent.length === 0) return null

  const total = urgent.reduce((sum, event) => sum + event.amount, 0)
  const shown = urgent.slice(0, 4)

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
          {pluralize(urgent.length, "bill")} · {formatCurrency(total)}
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
                      {event.title}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {config.label} · {event.description}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatCurrency(event.amount)}
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      {urgent.length > shown.length && (
        <p className="mt-2 text-xs text-muted-foreground">
          Showing {shown.length} of {urgent.length}. Select the Overdue card
          below to see them all.
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

function BillingEventDialog({ event, today, onClose, onViewBilling }) {
  const billing = event?.billing
  const config = event ? EVENT_TYPES[event.type] : null
  const Icon = config?.icon

  // Only calculated when the record stores a paid amount.
  const amountPaid =
    billing?.amount_paid != null ? Number(billing.amount_paid) : null
  const balance =
    amountPaid != null ? Math.max(Number(billing.amount) - amountPaid, 0) : null

  const firmName = billing?.firm_name ?? billing?.firm?.name
  const issueDate = parseDate(billing?.issue_date ?? billing?.issued_at)
  const notes = billing?.notes ?? billing?.remarks
  const isUnpaid = event && event.type !== "paid"

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
              <DetailRow label="Reference">{event.reference}</DetailRow>
              <DetailRow label="Service">
                {event.isRetainer ? "Retainer fee" : event.group}
              </DetailRow>
              <DetailRow label="Description">{billing?.description}</DetailRow>
              <DetailRow label="Accounting firm">{firmName}</DetailRow>
              <DetailRow label="Amount">{formatCurrency(event.amount)}</DetailRow>
              <DetailRow label="Amount paid">
                {amountPaid != null ? formatCurrency(amountPaid) : null}
              </DetailRow>
              <DetailRow label="Remaining balance">
                {balance != null ? formatCurrency(balance) : null}
              </DetailRow>
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

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
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

export default function ClientBillingCalendarPage() {
  const navigate = useNavigate()
  const today = useToday()

  // These hooks must return only the logged-in client's own records.
  // Enforce this on the backend too (e.g. Supabase row-level security);
  // the UI cannot guarantee it.
  const {
    data: billings = [],
    isLoading,
    error,
    refetch,
  } = useFetchBillings()
  const { data: engagements = [] } = useFetchEngagements()

  const [service, setService] = useState(ALL_SERVICES)
  const [selectedEvent, setSelectedEvent] = useState(null)

  usePageMeta({
    title: "Billing Calendar",
    breadcrumbs: [{ label: "Home", href: `${BASE_PATH}/dashboard` }],
  })

  const allEvents = useMemo(
    () => buildEvents({ billings, engagements, today }),
    [billings, engagements, today]
  )

  // Records the calendar cannot place because the firm has not set a due date.
  const missingDueDateCount = useMemo(
    () =>
      billings.filter(
        (billing) =>
          isTrackedStatus(billing.status) && !parseDate(billing.due_date)
      ).length,
    [billings]
  )

  const services = useMemo(
    () => [...new Set(allEvents.map((event) => event.group))].sort(),
    [allEvents]
  )

  const events = useMemo(
    () =>
      service === ALL_SERVICES
        ? allEvents
        : allEvents.filter((event) => event.group === service),
    [allEvents, service]
  )

  const serviceFilter =
    services.length > 1 ? (
      <div className="flex items-center gap-2">
        <label
          htmlFor="billing-service-filter"
          className="text-sm text-muted-foreground"
        >
          Service
        </label>
        <select
          id="billing-service-filter"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="h-9 min-w-0 max-w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <option value={ALL_SERVICES}>All services</option>
          {services.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>
    ) : null

  const notice = (
    <>
      <AttentionPanel events={events} onOpen={setSelectedEvent} />
      {missingDueDateCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {pluralize(missingDueDateCount, "billing record")} without a due date{" "}
          {missingDueDateCount === 1 ? "isn’t" : "aren’t"} shown here.{" "}
          <Link
            to={`${BASE_PATH}/billing`}
            className="font-medium text-emerald-700 hover:underline"
          >
            View all billing
          </Link>
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
        description="Track your upcoming billing dates and payment deadlines."
        summaryItems={getSummaryItems}
        summaryCaption="All billing records"
        onOpenEvent={setSelectedEvent}
        emptyMessage="No billing dates on this day."
        emptyTitle="No billing records yet"
        emptyDescription="When your accounting firm issues an invoice, its due date and payment status will appear on this calendar."
        loading={isLoading}
        error={error}
        onRetry={refetch ? () => refetch() : undefined}
        searchable
        searchPlaceholder="Search by service or invoice"
        toolbarExtras={serviceFilter}
        notice={notice}
        externalFiltersActive={service !== ALL_SERVICES}
        onClearExternalFilters={() => setService(ALL_SERVICES)}
      />

      <BillingEventDialog
        event={selectedEvent}
        today={today}
        onClose={() => setSelectedEvent(null)}
        onViewBilling={(event) => navigate(event.href)}
      />
    </>
  )
}
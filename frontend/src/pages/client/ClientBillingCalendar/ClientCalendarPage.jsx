import { useMemo } from "react"
import { useNavigate } from "react-router-dom"

import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchBillings } from "@/hooks/useBillings"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { EventCalendar } from "./event-calendar"
import {
  MONTH_NAMES,
  formatCurrency,
  parseDate,
  useToday,
} from "./calendar-utils"

const BASE_PATH = "/client"

// Key order here is also the sort order of events within a single day.
const EVENT_TYPES = {
  overdue: {
    label: "Overdue payment",
    chip: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-500",
  },
  payment_due: {
    label: "Payment due",
    chip: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-500",
  },
  verifying: {
    label: "Payment under review",
    chip: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  upload_due: {
    label: "Document due",
    chip: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500",
  },
  engagement_deadline: {
    label: "Engagement deadline",
    chip: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
}

// Billing statuses that still need action. Both the mock name (unpaid) and the
// database name (pending) are accepted.
const OPEN_BILLING_STATUSES = ["unpaid", "pending", "overdue", "for_verification"]

// Task statuses where the client still has to upload something.
const UPLOAD_TASK_STATUSES = ["missing", "for_revision"]

// Engagements that no longer have a deadline to track.
const CLOSED_ENGAGEMENT_STATUSES = ["completed", "cancelled"]

const getPendingPayment = (billing) =>
  billing.payments?.find((payment) => payment.status === "pending") ?? null

function buildEvents({ billings, engagements, today }) {
  const events = []
  const engagementById = new Map(
    engagements.map((engagement) => [String(engagement.id), engagement])
  )

  // 1. Invoices: due, overdue, or waiting for the firm to verify the payment.
  for (const billing of billings) {
    if (!OPEN_BILLING_STATUSES.includes(billing.status)) continue

    const dueDate = parseDate(billing.due_date)
    if (!dueDate) continue

    const isRetainer = billing.invoice_type === "retainer_fee"
    let title = "Service Fee"

    if (isRetainer) {
      const monthName = MONTH_NAMES[billing.billing_month - 1]
      title =
        monthName && billing.billing_year
          ? `Retainer Fee — ${monthName} ${billing.billing_year}`
          : "Retainer Fee"
    } else {
      const engagement = engagementById.get(String(billing.engagement_id))
      if (engagement?.serviceName) title = `Service Fee — ${engagement.serviceName}`
    }

    const pendingPayment = getPendingPayment(billing)
    const underReview =
      billing.status === "for_verification" || Boolean(pendingPayment)

    let type
    let date = dueDate
    let description

    if (underReview) {
      type = "verifying"
      date =
        parseDate(pendingPayment?.created_at ?? pendingPayment?.submitted_at) ??
        dueDate
      description = "Your payment was submitted and is being reviewed"
    } else if (billing.status === "overdue" || dueDate < today) {
      type = "overdue"
      description = "This invoice is past its due date"
    } else {
      type = "payment_due"
      description = "Please settle this invoice before the due date"
    }

    events.push({
      id: `billing-${billing.id}`,
      type,
      date,
      title,
      description,
      amount: Number(billing.amount) || 0,
      href: `${BASE_PATH}/billing/${billing.id}`,
      linkLabel: "View invoice",
    })
  }

  // 2. Engagements: target completion date and documents the client must upload.
  for (const engagement of engagements) {
    if (CLOSED_ENGAGEMENT_STATUSES.includes(engagement.status)) continue

    const serviceName = engagement.serviceName ?? "Engagement"
    const href = `${BASE_PATH}/engagements/${engagement.id}`

    const targetDate = parseDate(
      engagement.targetEndDate ?? engagement.target_end_date
    )
    if (targetDate) {
      events.push({
        id: `engagement-${engagement.id}`,
        type: "engagement_deadline",
        date: targetDate,
        title: serviceName,
        description: engagement.engagementNumber
          ? `${engagement.engagementNumber} — target completion date`
          : "Target completion date",
        href,
        linkLabel: "View engagement",
      })
    }

    for (const task of engagement.tasks ?? []) {
      if (!task.hasReferenceDocument) continue
      if (!UPLOAD_TASK_STATUSES.includes(task.status)) continue

      const deadline = parseDate(task.deadline ?? task.dueDate ?? task.due_date)
      if (!deadline) continue

      events.push({
        id: `task-${task.id}`,
        type: "upload_due",
        date: deadline,
        title: task.name ?? task.title ?? "Required document",
        description:
          task.status === "for_revision"
            ? `${serviceName} — revision requested`
            : `${serviceName} — upload required`,
        href,
        linkLabel: "Open engagement",
      })
    }
  }

  return events
}

// Summary cards for the month that is currently visible.
function getSummaryItems(monthEvents) {
  const pick = (type) => {
    const list = monthEvents.filter((event) => event.type === type)
    return {
      count: list.length,
      total: list.reduce((sum, event) => sum + (event.amount ?? 0), 0),
    }
  }

  const due = pick("payment_due")
  const overdue = pick("overdue")
  const uploads = pick("upload_due")
  const deadlines = pick("engagement_deadline")

  return [
    {
      label: "Payments due",
      value: due.count,
      hint: due.count ? formatCurrency(due.total) : "No payments due",
    },
    {
      label: "Overdue",
      value: overdue.count,
      hint: overdue.count ? formatCurrency(overdue.total) : "None overdue",
    },
    {
      label: "Documents to upload",
      value: uploads.count,
      hint: uploads.count ? "Check the dates below" : "Nothing to upload",
    },
    {
      label: "Engagement deadlines",
      value: deadlines.count,
      hint: "Target completion dates",
    },
  ]
}

export default function ClientCalendarPage() {
  const navigate = useNavigate()
  const today = useToday()

  // These hooks should return only the logged-in client's own records.
  // If your Client pages use different hooks, swap them in here.
  const {
    data: billings = [],
    isLoading,
    error,
  } = useFetchBillings()
  const { data: engagements = [] } = useFetchEngagements({ includeTasks: true })

  // The header appends the title after the breadcrumbs: "Home > My Calendar".
  usePageMeta({
    title: "My Calendar",
    breadcrumbs: [{ label: "Home", href: `${BASE_PATH}/dashboard` }],
  })

  const events = useMemo(
    () => buildEvents({ billings, engagements, today }),
    [billings, engagements, today]
  )

  return (
    <EventCalendar
      events={events}
      eventTypes={EVENT_TYPES}
      title="My Calendar"
      description="Payment due dates, document deadlines, and engagement target dates in one view"
      summaryItems={getSummaryItems}
      onOpenEvent={(event) => navigate(event.href)}
      emptyMessage="Nothing due on this day."
      loading={isLoading}
      error={error}
    />
  )
}
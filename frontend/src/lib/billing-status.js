import { parseDate } from "@/lib/date-utils"

export const getDueDate = (invoice) => invoice.dueDate ?? invoice.due_date ?? null

// One bucket per invoice, so nothing is counted twice.
//   paid | review | overdue | open | "" (cancelled / refunded: not shown)
// Moved out of ClientDashboard so firm dashboards use identical rules.
export function classifyInvoice(invoice, today) {
  if (invoice.status === "paid") return "paid"
  if (["cancelled", "refunded"].includes(invoice.status)) return ""
  if (invoice.status === "for verification") return "review"
  if (invoice.status === "for resubmission") return "open"
  const due = parseDate(getDueDate(invoice))
  if (invoice.status === "overdue" || (due && due < today)) return "overdue"
  return "open"
}

// Statuses that release a bill's engagements again. Both spellings of cancelled
// are listed because raw rows can carry either one.
const RELEASED_BILLING_STATUSES = ["cancelled", "canceled", "refunded"]

// Engagement ids referenced by an active billing. A cancelled/refunded bill
// releases its engagements again, and so does a link that was removed from the
// bill (is_active === false).
export const getBilledEngagementIds = (billings) =>
  new Set(
    billings
      .filter(
        (billing) => !RELEASED_BILLING_STATUSES.includes(billing.status)
      )
      .flatMap(
        (billing) => billing.active_engagement_ids ?? billing.engagement_ids ?? []
      )
  )

// Completed engagements that are not on any active billing yet.
export const getReadyToBill = (engagements, billings) => {
  const billed = getBilledEngagementIds(billings)
  return engagements.filter(
    (engagement) => engagement.status === "completed" && !billed.has(engagement.id)
  )
}
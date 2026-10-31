import { parseDate } from "@/lib/date-utils"
export const getDueDate = (invoice) => invoice.dueDate ?? invoice.due_date ?? null

// One bucket per invoice, so nothing is counted twice.
//   paid | review | overdue | open | "" (cancelled / refunded: not shown)
// Moved out of ClientDashboard so firm dashboards use identical rules.
export function classifyInvoice(invoice, today) {
  if (invoice.status === "paid") return "paid"
  if (["cancelled", "refunded"].includes(invoice.status)) return ""
  if (invoice.payment_status === "pending") return "review"
  const due = parseDate(getDueDate(invoice))
  if (invoice.status === "overdue" || (due && due < today)) return "overdue"
  return "open"
}

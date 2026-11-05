// One rule for "this client has an outstanding bill", used everywhere:
//   - client service request submission (block)
//   - engagement creation by Staff and Admin (block)
//   - the recurring-engagement watchlist (disabled row)
//
// Outstanding = a bill that is not paid, cancelled or refunded. That covers
// unpaid, overdue AND bills whose payment proof is still being verified.
// VERIFY: the status values below match your billings' `status` field.
//
// This is only the visible half. The backend must enforce the same rule (see
// backend-reference/hasOutstandingBill.js), because a UI check can be bypassed.

const CLOSED_STATUSES = ["paid", "cancelled", "refunded"]

export const OUTSTANDING_BILL_MESSAGE =
  "This client has an outstanding bill. It must be settled before a new engagement or service request can be created."

export const isOutstandingBill = (billing) =>
  !CLOSED_STATUSES.includes(billing.status)

const clientIdOf = (billing) => billing.client_id ?? billing.clientId

export const getOutstandingBills = (billings, clientId) =>
  billings.filter(
    (billing) => clientIdOf(billing) === clientId && isOutstandingBill(billing)
  )

export const hasOutstandingBill = (billings, clientId) =>
  getOutstandingBills(billings, clientId).length > 0

// For lists of many clients: build the set once, then check with .has(id).
export const buildOutstandingClientSet = (billings) =>
  new Set(
    billings.filter(isOutstandingBill).map(clientIdOf).filter(Boolean)
  )
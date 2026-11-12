export const ALL = "all"
export const MAX_SCREEN_ROWS = 100
export const UNAVAILABLE = "Unavailable"
export const EMPTY_RANGE = { from: "", to: "" }

export const ENGAGEMENT_STATUSES = [
  "document_collection",
  "for_validation",
  "in_progress",
  "completed",
  "cancelled",
]

export const CLIENT_TYPE_OPTIONS = [
  { value: "retainer", label: "Retainer" },
  { value: "non_retainer", label: "Non-retainer" },
]
export const COVERAGE_OPTIONS = [
  { value: "billable", label: "Billable" },
  { value: "retainer_covered", label: "Retainer-covered" },
]
// Derived from engagement status and linked bill status.
// A voided bill releases its engagement, so it counts as "unbilled" again.
export const ENGAGEMENT_BILLING_OPTIONS = [
  { value: "not_ready", label: "Not yet billable" },
  { value: "not_billable", label: "Not billable" },
  { value: "unbilled", label: "Unbilled" },
  { value: "unpaid", label: "Unpaid" },
  { value: "for_verification", label: "For Verification" },
  { value: "paid", label: "Paid" },
]
export const BILLING_TYPE_OPTIONS = [
  { value: "service_fee", label: "Service Fee" },
  { value: "retainer_fee", label: "Retainer Fee" },
]
export const PAYMENT_STATUS_OPTIONS = [
  { value: "paid", label: "Paid" },
  { value: "unpaid", label: "Unpaid" },
  { value: "for_verification", label: "For Verification" },
  { value: "voided", label: "Voided" },
]
export const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "GCash / Bank Transfer" },
  { value: "retainer", label: "Retainer" },
]

export const PAYMENT_STATUS_LABELS = Object.fromEntries(PAYMENT_STATUS_OPTIONS.map((o) => [o.value, o.label]))
export const METHOD_LABELS = { cash: "Cash", gcash: "GCash", bank_transfer: "Bank Transfer", retainer: "Retainer" }

// 3 operational reports. Kept as CATEGORIES so any other file importing it
// (and the tab tooltip) keeps working.
export const CATEGORIES = [
  { label: "Engagement Reports", views: [{ key: "engagements", label: "Engagement Report" }] },
  { label: "Billing Reports", views: [{ key: "billing", label: "Billing Report" }] },
  { label: "Client Reports", views: [{ key: "clients", label: "Client List" }] },
]

export const INITIAL_FILTERS = {
  engagements: {
    created: EMPTY_RANGE,
    status: ALL,
    billing: ALL, // NEW
    service: ALL,
    client: ALL,
    lead: ALL,
    coverage: ALL,
  },
  billing: {
    range: EMPTY_RANGE,
    type: ALL,
    status: ALL,
    method: ALL, // NEW (absorbed from Payment Monitoring)
    client: ALL,
  },
  clients: { q: "", type: ALL, status: ALL },
}
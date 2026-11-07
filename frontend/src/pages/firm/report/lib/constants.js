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

export const ROLE_LABELS = { admin: "Firm Admin", staff: "Firm Staff", billing_officer: "Billing Officer" }
export const PAYMENT_STATUS_LABELS = Object.fromEntries(PAYMENT_STATUS_OPTIONS.map((o) => [o.value, o.label]))
export const METHOD_LABELS = { cash: "Cash", gcash: "GCash", bank_transfer: "Bank Transfer", retainer: "Retainer" }

export const CATEGORIES = [
  { label: "Engagement Reports", views: [{ key: "engagements", label: "Engagement Summary" }] },
  {
    label: "Client Reports",
    views: [
      { key: "clients", label: "Client List" },
      { key: "clientRecord", label: "Client Record" },
    ],
  },
  {
    label: "Firm Reports",
    views: [
      { key: "users", label: "Firm User List" },
      { key: "userRecord", label: "Firm User Record" },
    ],
  },
  {
    label: "Billing Reports",
    views: [
      { key: "billing", label: "Billing Summary" },
      { key: "payments", label: "Payment Monitoring" },
    ],
  },
]

export const INITIAL_FILTERS = {
  engagements: {
    created: EMPTY_RANGE,
    completed: EMPTY_RANGE,
    status: ALL,
    service: ALL,
    client: ALL,
    lead: ALL,
    coverage: ALL,
  },
  clients: { q: "", type: ALL, status: ALL },
  clientRecord: { client: ALL },
  users: { q: "", role: ALL, status: ALL, created: EMPTY_RANGE },
  userRecord: { user: ALL },
  billing: { range: EMPTY_RANGE, type: ALL, status: ALL, client: ALL },
  payments: { type: ALL, status: ALL, method: ALL, client: ALL, verified: EMPTY_RANGE },
}
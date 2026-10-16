/**
 * Shared presentational maps and helpers for the Billing module.
 * Mirrors the firm user variants file (constants only, no logic coupling).
 */

export const INVOICE_TYPES = ["service_fee", "retainer_fee"]

export const invoiceTypeLabels = {
  service_fee: "Service Fee",
  retainer_fee: "Retainer Fee",
}

export const invoiceTypeFilterOptions = INVOICE_TYPES.map((value) => ({
  value,
  label: invoiceTypeLabels[value],
}))

export const billingStatusLabels = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  refunded: "Refunded",
  cancelled: "Cancelled",
}

export const PAYMENT_METHODS = [
  "gcash",
  "bank_transfer",
  "cash",
  "retainer",
]

export const paymentMethodLabels = {
  gcash: "GCash",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  retainer: "Retainer",
}

/** Semantic hex colors for status values, per the Accentra billing color system. */
export const statusToneColors = {
  pending: "#3B82F6",
  paid: "#10B981",
  overdue: "#DC2626",
  cancelled: "#6B7280",
  refunded: "#6B7280",
}

export const statusBadgeStyles = {
  pending: "bg-blue-500/10 text-blue-600 ring-blue-500/25",
  paid:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  overdue:
    "bg-red-600/10 text-red-700 ring-red-600/25 dark:bg-red-600/10 dark:text-red-400 dark:ring-red-500/20",
  cancelled: "bg-muted text-muted-foreground ring-border dark:bg-muted/50",
  refunded: "bg-muted text-muted-foreground ring-border dark:bg-muted/50",
}

export const statusDotStyles = {
  pending: "bg-blue-500",
  paid: "bg-emerald-500",
  overdue: "bg-red-600",
  cancelled: "bg-muted-foreground",
  refunded: "bg-muted-foreground",
}

export const billingStatusFilterOptions = Object.entries(billingStatusLabels).map(
  ([value, label]) => ({ value, label })
)

export const billingStatusChangeOptions = ["pending", "paid", "overdue", "cancelled", "refunded"].map(
  (value) => ({ value, label: billingStatusLabels[value] })
)

/** ₱2,500.00 — consistent Philippine peso formatting. */
export const formatPeso = (amount) => {
  const value = Number(amount)
  if (!Number.isFinite(value)) return "—"
  return `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** A payment can only be verified when it is awaiting review and has a reference. */
export const isVerifiable = (billing) =>
  billing?.payment_status === "pending" ||
  billing?.status === "for_verification" ||
  billing?.status === "pending" ||
  billing?.payments?.some((payment) => payment.status === "pending")

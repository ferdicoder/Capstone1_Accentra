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
  issued: "Issued",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
  // Legacy values are retained for records created before the billing schema migration.
  pending: "Pending Payment",
  unpaid: "Pending Payment",
  for_verification: "For Verification",
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
  unpaid: "#F59E0B",
  for_verification: "#3B82F6",
  paid: "#10B981",
  overdue: "#DC2626",
  cancelled: "#6B7280",
}

export const statusBadgeStyles = {
  issued: "bg-amber-500/10 text-amber-600 ring-amber-500/25",
  pending: "bg-blue-500/10 text-blue-600 ring-blue-500/25",
  unpaid:
    "bg-amber-500/10 text-amber-600 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  for_verification:
    "bg-blue-500/10 text-blue-600 ring-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20",
  paid:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  overdue:
    "bg-red-600/10 text-red-700 ring-red-600/25 dark:bg-red-600/10 dark:text-red-400 dark:ring-red-500/20",
  cancelled: "bg-muted text-muted-foreground ring-border dark:bg-muted/50",
}

export const statusDotStyles = {
  issued: "bg-amber-500",
  pending: "bg-blue-500",
  unpaid: "bg-amber-500",
  for_verification: "bg-blue-500",
  paid: "bg-emerald-500",
  overdue: "bg-red-600",
  cancelled: "bg-muted-foreground",
}

export const billingStatusFilterOptions = Object.entries(billingStatusLabels).map(
  ([value, label]) => ({ value, label })
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

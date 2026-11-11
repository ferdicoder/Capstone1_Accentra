/**
 * Constants and helpers for the firm service requests module.
 * Constants-only file so the fast-refresh lint rule stays happy.
 *
 * Data comes from serviceRequestAPI. A request holds the category the client
 * picked; the template (`serviceId`, `serviceName`) is only set once the admin
 * approves it. Registration data is grouped under `client` and `business`.
 */

export const statusBadgeStyles = {
  pending:
    "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  approved:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  rejected:
    "bg-red-500/10 text-red-600 ring-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
}

export const statusDotStyles = {
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-red-500",
}

/** Status options for the toolbar filter. Pass `[]` to hide the filter. */
export const statusFilterOptions = [
  { value: "all", label: "All Requests" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

/** Builds up to two initials from a company or person name. */
export const getInitials = (name) => {
  if (!name) return "AC"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/** Joins a client's name parts into a full name. */
export const getClientFullName = (client) =>
  [client?.firstName, client?.middleName, client?.lastName].filter(Boolean).join(" ") || "—"

/** Formats an ISO date string as e.g. "2025-07-02" -> "Jul 02, 2025". */
export const formatSubmittedDate = (value) => {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  })
}

/** Formats a revenue value as a PHP amount, e.g. 25000 -> "₱25,000". */
export const formatRevenue = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  return `₱${amount.toLocaleString("en-PH")}`
}
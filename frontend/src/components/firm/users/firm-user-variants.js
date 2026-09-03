/**
 * Shared presentational maps and helpers for the firm user list components.
 * Kept in a constants-only file (like `dashboard/NavData.jsx`) so the
 * fast-refresh lint rule stays happy.
 */

/** Maps a raw role value to its badge styling. Only Admin and Staff are used. */
export const roleBadgeStyles = {
  admin:
    "bg-forest-900/10 text-forest-900 ring-forest-900/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  staff:
    "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
}

/**
 * Maps a raw status value to its badge styling. Status is derived from system
 * activity (see UserManagementPage), never assigned manually:
 * - active: user has a live session
 * - inactive: account exists, no live session
 * - deactivated: admin manually deactivated the account
 */
export const statusBadgeStyles = {
  active:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  inactive: "bg-muted text-muted-foreground ring-border dark:bg-muted/50",
  deactivated:
    "bg-red-500/10 text-red-600 ring-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
}

/** Maps a raw status value to its leading dot color. */
export const statusDotStyles = {
  active: "bg-emerald-500",
  inactive: "bg-muted-foreground",
  deactivated: "bg-red-500",
}

/** Builds up to two initials from a full name, e.g. "Jane Marie Doe" -> "JD". */
export const getUserInitials = (name) => {
  if (!name) return "AC"
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

/**
 * Role options for filters and forms. Only Admin and Staff are supported by
 * the User Management module. Pass `roleOptions={[]}` to hide the filter.
 */
export const roleFilterOptions = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "billing_officer", label: "Billing Officer" }
]

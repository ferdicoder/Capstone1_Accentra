/**
 * Shared presentational maps and helpers for the firm user list components.
 * Kept in a constants-only file (like `dashboard/NavData.jsx`) so the
 * fast-refresh lint rule stays happy.
 */

/** Maps a raw role value to its badge styling. */
export const roleBadgeStyles = {
  admin:
    "bg-forest-900/10 text-forest-900 ring-forest-900/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  staff:
    "bg-sky-500/10 text-sky-700 ring-sky-500/25 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/20",
  accountant:
    "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  partner:
    "bg-violet-500/10 text-violet-700 ring-violet-500/25 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20",
  client:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
}

/** Maps a raw status value to its badge styling. */
export const statusBadgeStyles = {
  active:
    "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  invited:
    "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  pending:
    "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  suspended:
    "bg-red-500/10 text-red-600 ring-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20",
  inactive: "bg-muted text-muted-foreground ring-border dark:bg-muted/50",
}

/** Maps a raw status value to its leading dot color. */
export const statusDotStyles = {
  active: "bg-emerald-500",
  invited: "bg-amber-500",
  pending: "bg-amber-500",
  suspended: "bg-red-500",
  inactive: "bg-muted-foreground",
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

/** Default role options for the role filter. Pass `roleOptions={[]}` to hide it. */
export const roleFilterOptions = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "accountant", label: "Accountant" },
  { value: "partner", label: "Partner" },
  { value: "client", label: "Client" },
]

/** Default status options for the status filter. Pass `statusOptions={[]}` to hide it. */
export const statusFilterOptions = [
  { value: "active", label: "Active" },
  { value: "invited", label: "Invited" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" },
]

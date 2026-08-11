/**
 * Shared presentational maps and helpers for the firm service module.
 * Kept in a constants-only file (like `firm/users/firm-user-variants.js`) so
 * the fast-refresh lint rule stays happy.
 */

/** Maps a raw category value to its badge styling. */
export const categoryBadgeStyles = {
  "tax-filing":
    "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20",
  "business-registration":
    "bg-indigo-500/10 text-indigo-700 ring-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20",
}

/**
 * Maps a raw status value to its badge styling.
 * Status: active = published, inactive = draft, deactivated = off.
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

/** Category options for filters and forms. Pass `[]` to hide the filter. */
export const categoryFilterOptions = [
  { value: "tax-filing", label: "Tax Filing" },
  { value: "business-registration", label: "Business Registration" },
]

/** Status options for the toolbar filter and the form's Status field. */
export const statusFilterOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deactivated", label: "Deactivated" },
]

/** Formats a base price as a PHP amount, e.g. 2500 -> "₱2,500". */
export const formatBasePrice = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  return `₱${amount.toLocaleString("en-PH")}`
}

/**
 * Single source of truth for the service templates (name, price, category).
 * ServiceManagementPage seeds its mock catalog from here, and the Service
 * Requests module derives its request pricing from here, so the two modules
 * can never drift apart. Swap with a real API call later.
 */
export const serviceTemplateCatalog = [
  { name: "Tax Filing - Non VAT", price: 2500, category: "tax-filing" },
  { name: "Tax Filing - VAT", price: 3500, category: "tax-filing" },
  {
    name: "Business Registration - Sole Proprietorship",
    price: 8000,
    category: "business-registration",
  },
  { name: "Business Registration - Corporation", price: 15000, category: "business-registration" },
  { name: "Business Registration - Partnership", price: 12000, category: "business-registration" },
]

/** Returns the configured template price for a service name (0 if unknown). */
export const getServiceTemplatePrice = (serviceName) =>
  serviceTemplateCatalog.find((template) => template.name === serviceName)?.price ?? 0

/** Generates a short unique id for client-side records (tasks, services). */
export const createTaskId = () => Math.random().toString(36).slice(2, 10)

/** Formats a byte count as a human-readable size, e.g. 24576 -> "24 KB". */
export const formatBytes = (bytes) => {
  if (!bytes) return "0 KB"
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

// Factory (not a constant) so every create gets fresh ids and objects.
export const createDefaultWorkflowTasks = () => [
  { id: createTaskId(), name: "Submit Valid Government-issued ID", required: false, hasReferenceDocument: false, referenceDocument: null },
  { id: createTaskId(), name: "BIR Form 2307", required: false, hasReferenceDocument: false, referenceDocument: null },
  { id: createTaskId(), name: "Audited Financial Statements", required: false, hasReferenceDocument: false, referenceDocument: null },
  { id: createTaskId(), name: "Previous Year Tax Return", required: false, hasReferenceDocument: false, referenceDocument: null },
  { id: createTaskId(), name: "Official Receipts / Sales Summary", required: false, hasReferenceDocument: false, referenceDocument: null },
  { id: createTaskId(), name: "General Information Sheet", required: false, hasReferenceDocument: false, referenceDocument: null },
]

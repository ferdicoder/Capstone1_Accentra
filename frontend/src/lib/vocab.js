// Single source of truth for engagement stages and billing labels.
// Used by the client dashboard and every firm dashboard.
//
// ASSUMPTION: the DB values are document_collection, for_validation,
// in_progress, completed, cancelled. (The screenshot badges "For Validation" and
// "In Progress" come from humanize(), which means the DB values are
// for_validation and in_progress.) Confirm the first stage's exact value.

export const ENGAGEMENT_STAGES = {
  document_collection: {
    label: "Document Collection",
    tone: "bg-amber-50 text-amber-700",
  },
  for_validation: {
    label: "For Validation",
    tone: "bg-blue-50 text-blue-700",
  },
  in_progress: {
    label: "In Progress",
    tone: "bg-indigo-50 text-indigo-700",
  },
  completed: {
    label: "Completed",
    tone: "bg-emerald-50 text-emerald-700",
  },
  cancelled: {
    label: "Cancelled",
    tone: "bg-slate-100 text-slate-600",
  },
}

// "Active" = still being worked on. This is what the Active Engagements card
// must count.
export const ACTIVE_ENGAGEMENT_STATUSES = [
  "document_collection",
  "for_validation",
  "in_progress",
]

export const humanize = (value) =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

export const stageLabel = (status) =>
  ENGAGEMENT_STAGES[status]?.label ?? (status ? humanize(status) : "Unknown")

export const stageTone = (status) =>
  ENGAGEMENT_STAGES[status]?.tone ?? "bg-slate-100 text-slate-600"

export const BILLING_TYPE_LABELS = {
  service_fee: "Service Fee",
  retainer_fee: "Retainer Fee",
}

export const billingTypeLabel = (type) =>
  BILLING_TYPE_LABELS[type] ?? (type ? humanize(type) : "Bill")

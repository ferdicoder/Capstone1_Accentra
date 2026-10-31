// Engagement status display (colors + labels) and billing labels.
// Stage keys, order and "is active" come from @/lib/workflow-stages, so there is
// one source of truth. This file only adds what workflow-stages does not have:
// badge colors and display labels for statuses.
import { engagementStatusOptions, isEngagementActive } from "@/lib/workflow-stages"

// Re-exported so dashboards import everything status-related from one place.
export { isEngagementActive }

const STAGE_TONES = {
  document_collection: "bg-amber-50 text-amber-700",
  for_validation: "bg-blue-50 text-blue-700",
  in_progress: "bg-indigo-50 text-indigo-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-600",
}
  
export const humanize = (value) =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())

// Badge text for a status. workflow-stages labels "cancelled" as "Cancel
// Engagement" because it is used as an action button, so it is overridden here.
export const stageLabel = (status) => {
  if (status === "cancelled") return "Cancelled"
  return (
    engagementStatusOptions.find((option) => option.key === status)?.label ??
    (status ? humanize(status) : "Unknown")
  )
}

export const stageTone = (status) =>
  STAGE_TONES[status] ?? "bg-slate-100 text-slate-600"

export const BILLING_TYPE_LABELS = {
  service_fee: "Service Fee",
  retainer_fee: "Retainer Fee",
}

export const billingTypeLabel = (type) =>
  BILLING_TYPE_LABELS[type] ?? (type ? humanize(type) : "Bill")
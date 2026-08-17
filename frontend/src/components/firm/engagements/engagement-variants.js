export const statusBadgeStyles = {
  active: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
  completed: "bg-sky-500/10 text-sky-700 ring-sky-500/25",
  on_hold: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
  cancelled: "bg-red-500/10 text-red-600 ring-red-500/25",
}

export const statusDotStyles = {
  active: "bg-emerald-500",
  completed: "bg-sky-500",
  on_hold: "bg-amber-500",
  cancelled: "bg-red-500",
}

export const statusFilterOptions = [
  { value: "all", label: "All Engagements" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On Hold" },
  { value: "cancelled", label: "Cancelled" },
]

export const getClientFullName = (client) =>
  [client?.firstName, client?.middleName, client?.lastName].filter(Boolean).join(" ") || "—"

export const formatRevenue = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  return `₱${amount.toLocaleString("en-PH")}`
}

export const formatDate = (value) => {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
}

export const formatTimestamp = (value) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const datePart = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
  const timePart = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
  return `${datePart} · ${timePart}`
}

let engagementCounter = 100
export const generateEngagementNumber = () => {
  engagementCounter++
  return `ENG-2025-${String(engagementCounter).padStart(4, "0")}`
}

export const firmStaffMap = {
  "staff-001": "Maria Clara Santos",
  "staff-002": "Juan Dela Cruz",
  "staff-003": "Ana Reyes",
  "staff-004": "Carlos Mendoza",
}

export const getServiceCategoryLabel = (serviceName) => {
  if (!serviceName) return "—"
  if (serviceName.toLowerCase().includes("tax")) return "Tax Filing"
  if (serviceName.toLowerCase().includes("business registration")) return "Business Registration"
  return serviceName
}

export const workflowStages = [
  { key: "approved", label: "Approved" },
  { key: "docs", label: "Docs" },
  { key: "submitted", label: "Submitted" },
  { key: "review", label: "Review" },
  { key: "filing", label: "Filing" },
  { key: "billing", label: "Billing" },
  { key: "payment", label: "Payment" },
  { key: "done", label: "Done" },
]

export const getWorkflowProgress = (engagement) => {
  if (!engagement) return 0
  if (engagement.status === "cancelled") return 0
  if (engagement.status === "on_hold") return 2
  if (engagement.status === "completed") return 7

  const docs = engagement.documents ?? []
  if (docs.length === 0) return 1

  const reviewable = docs.filter((d) => d.status !== "pending")
  if (reviewable.length === 0) return 1

  const approved = reviewable.filter((d) => d.status === "approved")
  const inReview = reviewable.filter((d) => d.status === "in_review" || d.status === "revision_requested")

  if (approved.length === reviewable.length) return 4
  if (inReview.length > 0) return 3
  return 2
}

export const getWorkflowTimeline = (engagement) => {
  const currentStage = getWorkflowProgress(engagement)
  const docs = engagement.documents ?? []
  const submitted = docs.filter((d) => d.status !== "pending").length
  const total = docs.length
  const approved = docs.filter((d) => d.status === "approved").length

  return [
    { title: "Request Submitted", date: engagement?.startDate ?? "—", description: "Client submitted via portal", status: "completed" },
    { title: "Request Approved", date: engagement?.startDate ?? "—", description: `Approved by ${firmStaffMap[engagement?.assignedStaff] ?? "firm staff"}`, status: "completed" },
    { title: "Document Checklist Sent", date: engagement?.startDate ?? "—", description: total > 0 ? `${total} documents required` : "Awaiting document upload", status: "completed" },
    { title: "Documents Submitted", date: engagement?.startDate ?? "—", description: total > 0 ? `${submitted} of ${total} submitted` : "No documents submitted yet", status: currentStage >= 3 ? "completed" : currentStage === 2 ? "current" : "pending" },
    { title: "Documents Reviewed", date: "—", description: total > 0 ? `${approved} of ${total} approved` : "Pending review", status: currentStage >= 4 ? "completed" : currentStage === 3 ? "current" : "pending" },
    { title: "Processing / Filing", date: "—", description: "Awaiting processing", status: currentStage >= 5 ? "completed" : currentStage === 4 ? "current" : "pending" },
    { title: "Billing Created", date: "—", description: "Awaiting billing", status: currentStage >= 6 ? "completed" : currentStage === 5 ? "current" : "pending" },
    { title: "Payment Received", date: "—", description: "Awaiting payment", status: currentStage >= 7 ? "completed" : currentStage === 6 ? "current" : "pending" },
  ]
}

const documentStatusStyles = {
  in_review: "bg-purple-500/10 text-purple-700 ring-purple-500/25",
  submitted: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
  resubmitted: "bg-blue-500/10 text-blue-700 ring-blue-500/25",
  approved: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25",
  revision_requested: "bg-amber-500/10 text-amber-700 ring-amber-500/25",
  rejected: "bg-red-500/10 text-red-600 ring-red-500/25",
  pending: "bg-muted text-muted-foreground ring-border",
}

const documentStatusDots = {
  in_review: "bg-purple-500",
  submitted: "bg-emerald-500",
  resubmitted: "bg-blue-500",
  approved: "bg-emerald-500",
  revision_requested: "bg-amber-500",
  rejected: "bg-red-500",
  pending: "bg-muted-foreground",
}

export const documentStatusLabels = {
  in_review: "In Review",
  submitted: "Submitted",
  resubmitted: "Resubmitted",
  approved: "Approved",
  revision_requested: "Revision Requested",
  rejected: "Rejected",
  pending: "Pending",
}

export const getDocumentStatusStyles = (status) => documentStatusStyles[status] ?? "bg-muted text-muted-foreground ring-border"
export const getDocumentStatusDots = (status) => documentStatusDots[status] ?? "bg-muted-foreground"

export const getReviewDocuments = (engagement) =>
  (engagement?.documents ?? []).filter((doc) => doc.status !== "pending")

export const mockEngagements = []

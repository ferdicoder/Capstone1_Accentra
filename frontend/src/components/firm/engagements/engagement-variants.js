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

export const mockEngagements = [
  {
    id: "eng-001",
    engagementNumber: "ENG-2025-0100",
    serviceName: "Tax Filing - Non VAT",
    serviceFee: 2500,
    startDate: "2025-07-10",
    targetEndDate: "2025-08-15",
    status: "active",
    assignedStaff: "staff-001",
    internalNotes: "First engagement for this client. Priority filing.",
    documents: [
      { id: "doc-001", name: "BIR Form 1702RT (Draft)", uploadedBy: "Bernard Tan", uploadedDate: "2025-07-12", fileType: "PDF", fileSize: "1.1 MB", status: "in_review" },
      { id: "doc-002", name: "Alphalist of Employees", uploadedBy: "Bernard Tan", uploadedDate: "2025-07-12", fileType: "PDF", fileSize: "856 KB", status: "submitted" },
      { id: "doc-003", name: "BIR Form 2316", uploadedBy: "Maria Santos", uploadedDate: "2025-07-13", fileType: "PDF", fileSize: "432 KB", status: "submitted" },
      { id: "doc-004", name: "Schedule 1 Income Computation", uploadedBy: "Bernard Tan", uploadedDate: "2025-07-13", fileType: "XLSX", fileSize: "2.3 MB", status: "approved" },
      { id: "doc-005", name: "Financial Statements FY2024", uploadedBy: "Maria Santos", uploadedDate: "2025-07-14", fileType: "PDF", fileSize: "4.7 MB", status: "approved" },
    ],
    notes: [
      { id: "note-001", type: "internal", content: "Client requested clarification regarding Schedule A income computation.", visibility: "internal", relatedTo: "BIR Form 1702RT (Draft)", createdAt: "2025-07-14T10:35:00", author: "Maria Clara Santos" },
    ],
    reviewHistory: [
      { id: "hist-001", userName: "Maria Clara Santos", action: "submitted", comment: "Documents submitted for review.", timestamp: "2025-07-12T10:30:00" },
      { id: "hist-002", userName: "Maria Clara Santos", action: "in_review", comment: "Reviewing BIR Form 1702RT draft for accuracy.", timestamp: "2025-07-12T14:00:00" },
      { id: "hist-003", userName: "Maria Clara Santos", action: "approved", comment: "Schedule 1 income computation verified against AFS.", timestamp: "2025-07-13T16:30:00" },
    ],
    requestNumber: "SR-2025-0012",
    client: { firstName: "Maria", lastName: "Santos", contactNo: "0917 555 1234", email: "maria@santosretail.com" },
    business: { businessName: "Santos Retail Trading", businessType: "Sole Proprietorship", tinNo: "123-456-789-000", industry: "Retail", address: "12 Mercado St. Sta Ana Manila 1009" },
  },
  {
    id: "eng-002",
    engagementNumber: "ENG-2025-0101",
    serviceName: "Business Registration - Sole Proprietorship",
    serviceFee: 5000,
    startDate: "2025-07-01",
    targetEndDate: "2025-09-01",
    status: "active",
    assignedStaff: "staff-002",
    internalNotes: "New business registration. Need DTI, BIR, barangay, and mayor's permit.",
    documents: [
      { id: "doc-011", name: "Valid Government-issued ID", uploadedBy: "Carlos Reyes", uploadedDate: "2025-07-02", fileType: "JPG", fileSize: "2.1 MB", status: "approved" },
      { id: "doc-012", name: "TIN Certificate", uploadedBy: "Carlos Reyes", uploadedDate: "2025-07-02", fileType: "PDF", fileSize: "340 KB", status: "approved" },
      { id: "doc-013", name: "Business Address Proof", uploadedBy: "Carlos Reyes", uploadedDate: "2025-07-03", fileType: "PDF", fileSize: "1.2 MB", status: "submitted" },
    ],
    notes: [],
    reviewHistory: [
      { id: "hist-010", userName: "Juan Dela Cruz", action: "submitted", comment: "Initial documents received.", timestamp: "2025-07-02T09:00:00" },
      { id: "hist-011", userName: "Juan Dela Cruz", action: "approved", comment: "ID and TIN verified.", timestamp: "2025-07-03T11:00:00" },
    ],
    requestNumber: "SR-2025-0010",
    client: { firstName: "Carlos", lastName: "Reyes", contactNo: "0917 555 3456", email: "carlos@reyesconstructionsupply.ph" },
    business: { businessName: "Reyes Construction Supply", businessType: "Sole Proprietorship", tinNo: "789-123-456-000", industry: "Construction", address: "21 Rizal Ave. San Fernando Pampanga" },
  },
  {
    id: "eng-003",
    engagementNumber: "ENG-2025-0102",
    serviceName: "Tax Filing - VAT",
    serviceFee: 3500,
    startDate: "2025-06-15",
    targetEndDate: "2025-07-25",
    status: "completed",
    assignedStaff: "staff-003",
    internalNotes: "Quarterly VAT return filed on time.",
    documents: [
      { id: "doc-020", name: "VAT Return 2550M", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-18", fileType: "PDF", fileSize: "2.1 MB", status: "approved" },
      { id: "doc-021", name: "Official Receipts Summary", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-18", fileType: "PDF", fileSize: "3.4 MB", status: "approved" },
      { id: "doc-022", name: "Sales Summary Schedule", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-19", fileType: "XLSX", fileSize: "1.2 MB", status: "approved" },
    ],
    notes: [],
    reviewHistory: [
      { id: "hist-020", userName: "Ana Reyes", action: "submitted", comment: "VAT documents submitted.", timestamp: "2025-06-18T09:00:00" },
      { id: "hist-021", userName: "Ana Reyes", action: "approved", comment: "All documents verified. Filing completed.", timestamp: "2025-06-20T15:00:00" },
    ],
    requestNumber: "SR-2025-0011",
    client: { firstName: "Ana", lastName: "Dela Cruz", contactNo: "0917 555 2345", email: "ana@delacruzbakery.ph" },
    business: { businessName: "Dela Cruz Bakery & Pastries", businessType: "Sole Proprietorship", tinNo: "456-789-123-000", industry: "Food & Beverage", address: "88 Gen. Luna St. Malolos Bulacan" },
  },
]

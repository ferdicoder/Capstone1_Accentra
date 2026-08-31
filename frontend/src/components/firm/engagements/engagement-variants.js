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

// ─── Unified 5-Stage Workflow ─────────────────────────────────────────────────

export const workflowStages = [
  { key: "documentation_collection", label: "Documentation Collection" },
  { key: "document_verification", label: "Document Verification" },
  { key: "processing", label: "Processing" },
  { key: "approval", label: "Approval" },
  { key: "payment", label: "Payment" },
]

export const workflowStageOptions = [
  { value: "documentation_collection", label: "Documentation Collection" },
  { value: "document_verification", label: "Document Verification" },
  { value: "processing", label: "Processing" },
  { value: "approval", label: "Approval" },
  { value: "payment", label: "Payment" },
]

export const getWorkflowStageIndex = (stage) => {
  const idx = workflowStages.findIndex((s) => s.key === stage)
  return idx >= 0 ? idx : 0
}

export const isWorkflowComplete = (stage) => stage === "completed"
export const isWorkflowCancelled = (stage) => stage === "cancelled"

// ─── Legacy helpers (kept for backward compat in document review, etc.) ────────

const taxFilingServiceNames = [
  "Tax Filing - Non VAT",
  "Tax Filing - VAT",
  "Income Tax Filing",
  "Withholding Tax Filing",
]

const isTaxFilingEngagement = (engagement) =>
  taxFilingServiceNames.includes(engagement?.serviceName)

export const getWorkflowProgress = (engagement) => {
  if (!engagement) return 0
  if (engagement.status === "cancelled") return 0
  if (engagement.status === "on_hold") return 2
  if (engagement.status === "completed") return 4

  const stage = engagement.workflowStage
  if (!stage) return 0
  if (stage === "completed") return 4
  if (stage === "cancelled") return 0
  return getWorkflowStageIndex(stage)
}

// ─── Document status helpers ──────────────────────────────────────────────────

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const mockEngagements = [
  {
    id: "eng-001",
    engagementNumber: "ENG-2025-0100",
    serviceName: "Tax Filing - Non VAT",
    serviceFee: 2500,
    startDate: "2025-07-10",
    targetEndDate: "2025-08-15",
    status: "active",
    workflowStage: "document_verification",
    assignedStaff: "staff-001",
    internalNotes: "First engagement for this client. Priority filing.",
    documents: [
      { id: "doc-001", name: "Monthly Gross Sales Summary", uploadedBy: "Bernard Tan", uploadedDate: "2025-07-12", fileType: "PDF", fileSize: "1.1 MB", status: "in_review" },
      { id: "doc-002", name: "Sales Record", uploadedBy: "Bernard Tan", uploadedDate: "2025-07-12", fileType: "PDF", fileSize: "856 KB", status: "submitted" },
    ],
    notes: [
      { id: "note-001", type: "internal", content: "Client requested clarification regarding Schedule A income computation.", visibility: "internal", relatedTo: "BIR Form 1702RT (Draft)", createdAt: "2025-07-14T10:35:00", author: "Maria Clara Santos" },
    ],
    activityUpdates: [
      { id: "act-001", title: "Documents submitted for review", description: "Client submitted Monthly Gross Sales Summary and Sales Record for verification.", createdAt: "2025-07-12T10:30:00", author: "Maria Clara Santos" },
      { id: "act-002", title: "Document verification in progress", description: "Reviewing submitted documents for completeness and accuracy.", createdAt: "2025-07-13T09:00:00", author: "Maria Clara Santos" },
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
    workflowStage: "processing",
    assignedStaff: "staff-002",
    internalNotes: "New business registration. Need DTI, BIR, barangay, and mayor's permit.",
    documents: [
      { id: "doc-011", name: "Valid Government-issued ID", uploadedBy: "Carlos Reyes", uploadedDate: "2025-07-02", fileType: "JPG", fileSize: "2.1 MB", status: "approved" },
      { id: "doc-012", name: "TIN Certificate", uploadedBy: "Carlos Reyes", uploadedDate: "2025-07-02", fileType: "PDF", fileSize: "340 KB", status: "approved" },
      { id: "doc-013", name: "Business Address Proof", uploadedBy: "Carlos Reyes", uploadedDate: "2025-07-03", fileType: "PDF", fileSize: "1.2 MB", status: "submitted" },
    ],
    notes: [],
    activityUpdates: [
      { id: "act-010", title: "Registration processing started", description: "DTI registration submitted. Awaiting confirmation from DTI.", createdAt: "2025-07-05T14:20:00", author: "Juan Dela Cruz" },
      { id: "act-011", title: "DTI registration approved", description: "DTI confirmed the business name reservation. Proceeding with BIR registration.", createdAt: "2025-07-10T10:00:00", author: "Juan Dela Cruz" },
    ],
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
    status: "active",
    workflowStage: "approval",
    assignedStaff: "staff-003",
    internalNotes: "Quarterly VAT return filed on time.",
    documents: [
      { id: "doc-020", name: "Sales Summary", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-18", fileType: "PDF", fileSize: "2.1 MB", status: "approved" },
      { id: "doc-021", name: "Purchase Summary", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-18", fileType: "PDF", fileSize: "3.4 MB", status: "approved" },
      { id: "doc-022", name: "VAT Input Summary", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-19", fileType: "XLSX", fileSize: "1.2 MB", status: "approved" },
      { id: "doc-023", name: "VAT Output Summary", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-19", fileType: "XLSX", fileSize: "980 KB", status: "approved" },
      { id: "doc-024", name: "BIR Invoices", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-20", fileType: "PDF", fileSize: "4.5 MB", status: "approved" },
      { id: "doc-025", name: "BIR Receipts", uploadedBy: "Ana Reyes", uploadedDate: "2025-06-20", fileType: "PDF", fileSize: "3.8 MB", status: "approved" },
    ],
    notes: [],
    activityUpdates: [
      { id: "act-020", title: "All VAT documents verified", description: "All six required documents have been reviewed and approved.", createdAt: "2025-06-20T15:00:00", author: "Ana Reyes" },
      { id: "act-021", title: "VAT computation submitted for approval", description: "Tax computation sent to client for review and approval.", createdAt: "2025-06-22T09:30:00", author: "Ana Reyes" },
    ],
    reviewHistory: [
      { id: "hist-020", userName: "Ana Reyes", action: "submitted", comment: "VAT documents submitted.", timestamp: "2025-06-18T09:00:00" },
      { id: "hist-021", userName: "Ana Reyes", action: "approved", comment: "All documents verified. Filing completed.", timestamp: "2025-06-20T15:00:00" },
    ],
    requestNumber: "SR-2025-0011",
    client: { firstName: "Ana", lastName: "Dela Cruz", contactNo: "0917 555 2345", email: "ana@delacruzbakery.ph" },
    business: { businessName: "Dela Cruz Bakery & Pastries", businessType: "Sole Proprietorship", tinNo: "456-789-123-000", industry: "Food & Beverage", address: "88 Gen. Luna St. Malolos Bulacan" },
  },
]

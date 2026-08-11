/**
 * Constants, helpers and mock data for the firm service requests module.
 * Constants-only file so the fast-refresh lint rule stays happy.
 */

import { getServiceTemplatePrice } from "../service-management/service-management-variants"

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

/** Formats a revenue value as a PHP amount, e.g. 25000 -> "₱25,000". */
export const formatRevenue = (value) => {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return "—"
  return `₱${amount.toLocaleString("en-PH")}`
}

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

/**
 * Mock data — swap with a real API call later. Service names and revenue are
 * derived from the Service Management module's `serviceTemplateCatalog`, so
 * request pricing always matches the configured service template price.
 */
export const mockServiceRequests = [
  {
    id: "sr-001",
    requestNumber: "SR-2025-0012",
    companyName: "Santos Retail Trading",
    serviceName: "Tax Filing - Non VAT",
    revenue: getServiceTemplatePrice("Tax Filing - Non VAT"),
    entityType: "Sole Proprietorship",
    tin: "123-456-789-000",
    contactPerson: "Maria Santos",
    submittedDate: "2025-07-02",
    notes:
      "First year filing for the business. All sales invoices are compiled and ready; we can provide access on request. Please also advise on available deductions and creditable withholding taxes.",
    status: "pending",
  },
  {
    id: "sr-002",
    requestNumber: "SR-2025-0011",
    companyName: "Dela Cruz Bakery & Pastries",
    serviceName: "Tax Filing - VAT",
    revenue: getServiceTemplatePrice("Tax Filing - VAT"),
    entityType: "Sole Proprietorship",
    tin: "456-789-123-000",
    contactPerson: "Ana Dela Cruz",
    submittedDate: "2025-06-28",
    notes:
      "Quarterly VAT return for the second quarter. We will upload the 2550M attachments and official receipts ahead of the filing deadline.",
    status: "pending",
  },
  {
    id: "sr-003",
    requestNumber: "SR-2025-0010",
    companyName: "Reyes Construction Supply",
    serviceName: "Business Registration - Sole Proprietorship",
    revenue: getServiceTemplatePrice("Business Registration - Sole Proprietorship"),
    entityType: "Sole Proprietorship",
    tin: "789-123-456-000",
    contactPerson: "Carlos Reyes",
    submittedDate: "2025-06-24",
    notes:
      "Full registration for a new hardware supply store. Need DTI, BIR, barangay, and mayor's permit handled end-to-end.",
    status: "pending",
  },
  {
    id: "sr-004",
    requestNumber: "SR-2025-0009",
    companyName: "Villanueva Farms Inc.",
    serviceName: "Business Registration - Corporation",
    revenue: getServiceTemplatePrice("Business Registration - Corporation"),
    entityType: "Corporation",
    tin: "321-654-987-000",
    contactPerson: "Rosa Villanueva",
    submittedDate: "2025-06-18",
    notes:
      "SEC incorporation for the agricultural arm of the group. Name reservation, articles of incorporation, and bylaws all need to be filed.",
    status: "approved",
  },
  {
    id: "sr-005",
    requestNumber: "SR-2025-0008",
    companyName: "Fernandez Coffee House",
    serviceName: "Business Registration - Partnership",
    revenue: getServiceTemplatePrice("Business Registration - Partnership"),
    entityType: "Partnership",
    tin: "654-321-987-000",
    contactPerson: "Paolo Fernandez",
    submittedDate: "2025-06-11",
    notes:
      "SEC registration for a partnership that will operate two coffee branches. Partnership agreement is ready for review.",
    status: "approved",
  },
  {
    id: "sr-006",
    requestNumber: "SR-2025-0007",
    companyName: "Aquino Logistics Services",
    serviceName: "Business Registration - Corporation",
    revenue: getServiceTemplatePrice("Business Registration - Corporation"),
    entityType: "Corporation",
    tin: "987-654-321-000",
    contactPerson: "Dennis Aquino",
    submittedDate: "2025-06-05",
    notes:
      "SEC registration for a logistics corporation. The intended corporate name is already reserved under a different applicant — requesting guidance on alternatives.",
    status: "rejected",
  },
  {
    id: "sr-007",
    requestNumber: "SR-2025-0006",
    companyName: "Torres Hardware & Paint",
    serviceName: "Tax Filing - Non VAT",
    revenue: getServiceTemplatePrice("Tax Filing - Non VAT"),
    entityType: "Sole Proprietorship",
    tin: "159-753-486-000",
    contactPerson: "Jose Torres",
    submittedDate: "2025-05-30",
    notes:
      "Annual income tax return. Previous preparer left incomplete records, so a bit of cleanup may be needed before filing.",
    status: "rejected",
  },
]

/**
 * Constants, helpers and mock data for the firm service requests module.
 * Constants-only file so the fast-refresh lint rule stays happy.
 *
 * Data shape note: no ERD file exists in the repo, so field names mirror the
 * existing registration structure (authService.registerClient user_metadata)
 * and the `users` table. Each request keeps request-specific fields at the
 * top level and groups registration data under `client` and `business` so it
 * maps cleanly to the backend later.
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

/** Joins a client's name parts into a full name. */
export const getClientFullName = (client) =>
  [client?.firstName, client?.middleName, client?.lastName].filter(Boolean).join(" ") || "—"

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
 * derived from the Service Management module's `serviceTemplateCatalog`.
 * Request-specific fields live at the top level; `client` and `business` hold
 * the account/registration data collected during signup.
 */
export const mockServiceRequests = [
  {
    id: "sr-001",
    requestNumber: "SR-2025-0012",
    serviceName: "Tax Filing - Non VAT",
    revenue: getServiceTemplatePrice("Tax Filing - Non VAT"),
    submittedDate: "2025-07-02",
    notes:
      "First year filing for the business. All sales invoices are compiled and ready; we can provide access on request. Please also advise on available deductions and creditable withholding taxes.",
    status: "pending",
    client: {
      firstName: "Maria",
      lastName: "Santos",
      contactNo: "0917 555 1234",
      email: "maria@santosretail.com",
    },
    business: {
      businessName: "Santos Retail Trading",
      businessType: "Sole Proprietorship",
      tinNo: "123-456-789-000",
      industry: "Retail",
      address: "12 Mercado St. Sta Ana Manila 1009",
    },
  },
  {
    id: "sr-002",
    requestNumber: "SR-2025-0011",
    serviceName: "Tax Filing - VAT",
    revenue: getServiceTemplatePrice("Tax Filing - VAT"),
    submittedDate: "2025-06-28",
    notes:
      "Quarterly VAT return for the second quarter. We will upload the 2550M attachments and official receipts ahead of the filing deadline.",
    status: "pending",
    client: {
      firstName: "Ana",
      lastName: "Dela Cruz",
      contactNo: "0917 555 2345",
      email: "ana@delacruzbakery.ph",
    },
    business: {
      businessName: "Dela Cruz Bakery & Pastries",
      businessType: "Sole Proprietorship",
      tinNo: "456-789-123-000",
      industry: "Food & Beverage",
      address: "88 Gen. Luna St. Malolos Bulacan",
    },
  },
  {
    id: "sr-003",
    requestNumber: "SR-2025-0010",
    serviceName: "Business Registration - Sole Proprietorship",
    revenue: getServiceTemplatePrice("Business Registration - Sole Proprietorship"),
    submittedDate: "2025-06-24",
    notes:
      "Full registration for a new hardware supply store. Need DTI, BIR, barangay, and mayor's permit handled end-to-end.",
    status: "pending",
    client: {
      firstName: "Carlos",
      lastName: "Reyes",
      contactNo: "0917 555 3456",
      email: "carlos@reyesconstructionsupply.ph",
    },
    business: {
      businessName: "Reyes Construction Supply",
      businessType: "Sole Proprietorship",
      tinNo: "789-123-456-000",
      industry: "Construction",
      address: "21 Rizal Ave. San Fernando Pampanga",
    },
  },
  {
    id: "sr-004",
    requestNumber: "SR-2025-0009",
    serviceName: "Business Registration - Corporation",
    revenue: getServiceTemplatePrice("Business Registration - Corporation"),
    submittedDate: "2025-06-18",
    notes:
      "SEC incorporation for the agricultural arm of the group. Name reservation, articles of incorporation, and bylaws all need to be filed.",
    status: "pending",
    client: {
      firstName: "Rosa",
      lastName: "Villanueva",
      contactNo: "0917 555 4567",
      email: "rosa@villanuevafarms.ph",
    },
    business: {
      businessName: "Villanueva Farms Inc.",
      businessType: "Corporation",
      tinNo: "321-654-987-000",
      industry: "Agriculture",
      address: "Brgy. San Isidro Tarlac City",
    },
  },
  {
    id: "sr-005",
    requestNumber: "SR-2025-0008",
    serviceName: "Business Registration - Partnership",
    revenue: getServiceTemplatePrice("Business Registration - Partnership"),
    submittedDate: "2025-06-11",
    notes:
      "SEC registration for a partnership that will operate two coffee branches. Partnership agreement is ready for review.",
    status: "pending",
    client: {
      firstName: "Paolo",
      lastName: "Fernandez",
      contactNo: "0917 555 5678",
      email: "paolo@fernandezcoffee.ph",
    },
    business: {
      businessName: "Fernandez Coffee House",
      businessType: "Partnership",
      tinNo: "654-321-987-000",
      industry: "Food & Beverage",
      address: "5 Katipunan Ave. Quezon City",
    },
  },
  {
    id: "sr-006",
    requestNumber: "SR-2025-0007",
    serviceName: "Business Registration - Corporation",
    revenue: getServiceTemplatePrice("Business Registration - Corporation"),
    submittedDate: "2025-06-05",
    notes:
      "SEC registration for a logistics corporation. The intended corporate name is already reserved under a different applicant — requesting guidance on alternatives.",
    status: "pending",
    client: {
      firstName: "Dennis",
      lastName: "Aquino",
      contactNo: "0917 555 6789",
      email: "dennis@aquinologistics.ph",
    },
    business: {
      businessName: "Aquino Logistics Services",
      businessType: "Corporation",
      tinNo: "987-654-321-000",
      industry: "Logistics",
      address: "Lot 3 North Harbour Manila",
    },
  },
  {
    id: "sr-007",
    requestNumber: "SR-2025-0006",
    serviceName: "Tax Filing - Non VAT",
    revenue: getServiceTemplatePrice("Tax Filing - Non VAT"),
    submittedDate: "2025-05-30",
    notes:
      "Annual income tax return. Previous preparer left incomplete records, so a bit of cleanup may be needed before filing.",
    status: "pending",
    client: {
      firstName: "Jose",
      lastName: "Torres",
      contactNo: "0917 555 7890",
      email: "jose@torreshardware.ph",
    },
    business: {
      businessName: "Torres Hardware & Paint",
      businessType: "Sole Proprietorship",
      tinNo: "159-753-486-000",
      industry: "Retail",
      address: "34 Mabini St. Dagupan City",
    },
  },
]

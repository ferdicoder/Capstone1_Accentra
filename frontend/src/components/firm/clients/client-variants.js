/**
 * Shared constants and helpers for the firm Client Management module.
 * Constants/helpers only so the fast-refresh lint rule stays happy.
 *
 * Data note: there is no standalone "clients" source in the frontend. A client
 * is the owner of a business (one business per client), and is already carried
 * on every engagement and service request as `{ client, business }`. Client
 * Management derives its records from those existing sources, keyed by
 * `business.id`, which is the only stable identifier available on both.
 */

import { isEngagementActive } from "@/lib/workflow-stages"

/** Fields the Firm Admin may edit. Identifiers and status are system-controlled. */
export const editableClientFields = [
  "clientType",
  "firstName",
  "middleName",
  "lastName",
  "email",
  "contactNo",
  "businessName",
  "businessType",
  "industry",
  "tinNo",
  "address",
  "deactivated",
]

/**
 * Client status is derived from existing activity (like user status in User
 * Management) and is never assigned manually, except deactivation:
 * - deactivated: a Firm Admin deactivated the client (local state)
 * - active: at least one open engagement or pending service request
 * - inactive: no open engagement and no pending service request
 */
export const clientStatusFilterOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "deactivated", label: "Deactivated" },
]

/** Options for the Business Type dropdown (same choices as client registration). */
export const businessTypeOptions = [
  "Sole Proprietorship",
  "Partnership",
  "Corporation",
  "Cooperative",
].map((label) => ({ value: label, label }))

/** Options for the Industry dropdown (same choices as client registration). */
export const industryOptions = ["Accounting", "Retail", "Manufacturing", "Services"].map(
  (label) => ({ value: label, label })
)

const normalizeOption = (value) => String(value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "")

/**
 * Maps a stored value (registration saves labels, the client profile saves
 * slugs like "sole-proprietorship") onto an option value. Returns the original
 * value untouched when nothing matches so existing data is never lost.
 */
export const matchOptionValue = (options, value) => {
  if (!value) return ""
  const match = options.find((option) => normalizeOption(option.value) === normalizeOption(value))
  return match ? match.value : value
}

/**
 * Client type. The existing data has no client-type field, so it is a
 * frontend-only attribute: every client is Non-retainer until a Firm Admin
 * marks it as Retainer (stored with the other local client edits).
 */
export const DEFAULT_CLIENT_TYPE = "non_retainer"

export const clientTypeOptions = [
  { value: "retainer", label: "Retainer" },
  { value: "non_retainer", label: "Non-retainer" },
]

export const clientTypeLabels = Object.fromEntries(
  clientTypeOptions.map((option) => [option.value, option.label])
)

export const clientTypeBadgeStyles = {
  retainer:
    "bg-forest-900/10 text-forest-900 ring-forest-900/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  non_retainer: "bg-muted text-muted-foreground ring-border dark:bg-muted/50",
}

export const getClientDisplayName = (client) =>
  [client?.firstName, client?.middleName, client?.lastName].filter(Boolean).join(" ").trim()

/**
 * Builds the client list from engagements + service requests, then applies any
 * locally edited values (`overrides`, keyed by client id).
 */
export function deriveClients({ engagements = [], serviceRequests = [], overrides = {} }) {
  const byId = new Map()

  const register = (record) => {
    const business = record?.business
    if (!business?.id || byId.has(business.id)) return
    byId.set(business.id, {
      id: business.id,
      firstName: record.client?.firstName ?? "",
      middleName: record.client?.middleName ?? "",
      lastName: record.client?.lastName ?? "",
      email: record.client?.email ?? "",
      contactNo: record.client?.contactNo || business.contactNo || "",
      businessName: business.businessName ?? "",
      businessType: business.businessType ?? "",
      industry: business.industry ?? "",
      tinNo: business.tinNo ?? "",
      address: business.address ?? "",
    })
  }

  serviceRequests.forEach(register)
  engagements.forEach(register)

  return [...byId.values()].map((base) => {
    const merged = { clientType: DEFAULT_CLIENT_TYPE, ...base, ...(overrides[base.id] ?? {}) }
    const client = {
      ...merged,
      // Unknown/stale stored types fall back to Non-retainer.
      clientType: merged.clientType in clientTypeLabels ? merged.clientType : DEFAULT_CLIENT_TYPE,
      businessType: matchOptionValue(businessTypeOptions, merged.businessType),
      industry: matchOptionValue(industryOptions, merged.industry),
    }
    const history = getClientEngagements(engagements, client.id)
    const hasPendingRequest = serviceRequests.some(
      (request) => request.business?.id === client.id && request.status === "pending"
    )
    const hasOpenEngagement = history.some((engagement) => isEngagementActive(engagement.status))

    return {
      ...client,
      name: getClientDisplayName(client),
      status: client.deactivated
        ? "deactivated"
        : hasOpenEngagement || hasPendingRequest
          ? "active"
          : "inactive",
      engagementCount: history.length,
    }
  })
}

/** Engagements that belong to a client (engagement.business.id === client.id), newest first. */
export function getClientEngagements(engagements = [], clientId) {
  return engagements
    .filter((engagement) => engagement.business?.id === clientId)
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")))
}

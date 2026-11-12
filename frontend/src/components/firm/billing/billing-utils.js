import { formatPeso, normalizeBillingStatus } from "./billing-variants"

/** Derive display info for the engagement a billing record belongs to. */
export function getEngagementDisplay(engagements, engagementId) {
  const engagement = engagements?.find((e) => e.id === engagementId)
  if (!engagement) {
    return { title: "Unknown engagement", subtitle: null }
  }
  const businessName = engagement.business?.businessName
  return {
    title: engagement.engagementNumber ?? "—",
    subtitle: [engagement.serviceName, businessName].filter(Boolean).join(" · ") || null,
  }
}

/** Build the standard summary set from billing records. */
export function buildBillingSummaryItems(billings = []) {
  const sum = (list) => list.reduce((total, b) => total + (Number(b.amount) || 0), 0)
  // Cancelled/voided bills were never owed and refunded ones are no longer owed.
  const excludedStatuses = new Set(["cancelled", "voided", "void", "refunded"])
  const isExcluded = (b) => excludedStatuses.has(normalizeBillingStatus(b.status))
  const active = billings.filter((b) => !isExcluded(b))
  const unpaidStatuses = new Set(["pending", "overdue", "for verification", "for resubmission"])
  const pending = active.filter((b) => unpaidStatuses.has(normalizeBillingStatus(b.status)))
  const paid = active.filter((b) => normalizeBillingStatus(b.status) === "paid")

  return [
    { label: "Total Billing", value: formatPeso(sum(active)), hint: `${active.length} record${active.length === 1 ? "" : "s"}`, toneColor: "#02353C" },
    { label: "Pending Payment", value: formatPeso(sum(pending)), hint: `${pending.length} record${pending.length === 1 ? "" : "s"}`, toneColor: "#3B82F6" },
    { label: "Paid", value: formatPeso(sum(paid)), hint: `${paid.length} record${paid.length === 1 ? "" : "s"}`, toneColor: "#10B981" },
  ]
}

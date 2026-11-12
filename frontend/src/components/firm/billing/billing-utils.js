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
export function buildBillingSummaryItems(billings = [], month = "") {
  const sum = (list) => list.reduce((total, b) => total + (Number(b.amount) || 0), 0)
  const [year, monthNumber] = month.split("-").map(Number)
  const inSelectedMonth = (billing) => {
    if (!month) return true
    if (!year || monthNumber < 1 || monthNumber > 12) return false

    if (
      billing.invoice_type === "retainer_fee" &&
      billing.billing_month != null &&
      billing.billing_year != null
    ) {
      return Number(billing.billing_month) === monthNumber &&
        Number(billing.billing_year) === year
    }

    return billing.due_date?.slice(0, 7) === month
  }
  const monthlyBillings = billings.filter(inSelectedMonth)
  // Cancelled/voided bills were never owed and refunded ones are no longer owed.
  const excludedStatuses = new Set(["cancelled", "voided", "void", "refunded"])
  const isExcluded = (b) => excludedStatuses.has(normalizeBillingStatus(b.status))
  const active = monthlyBillings.filter((b) => !isExcluded(b))
  const unpaidStatuses = new Set(["pending", "overdue", "for verification", "for resubmission"])
  const pending = active.filter((b) => unpaidStatuses.has(normalizeBillingStatus(b.status)))
  const paid = active.filter((b) => normalizeBillingStatus(b.status) === "paid")
  const cancelledStatuses = new Set(["cancelled", "voided", "void"])
  const cancelled = monthlyBillings.filter((b) => cancelledStatuses.has(normalizeBillingStatus(b.status)))

  return [
    { label: "Total Billing", value: formatPeso(sum(active)), hint: `${active.length} record${active.length === 1 ? "" : "s"}`, toneColor: "#02353C" },
    { label: "Pending Payment", value: formatPeso(sum(pending)), hint: `${pending.length} record${pending.length === 1 ? "" : "s"}`, toneColor: "#3B82F6" },
    { label: "Paid", value: formatPeso(sum(paid)), hint: `${paid.length} record${paid.length === 1 ? "" : "s"}`, toneColor: "#10B981" },
    { label: "Cancelled Bills", value: cancelled.length, hint: `${cancelled.length} record${cancelled.length === 1 ? "" : "s"}`, toneColor: "#6B7280" },
  ]
}

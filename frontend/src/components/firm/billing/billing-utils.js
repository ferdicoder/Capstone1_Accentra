import { formatPeso } from "./billing-variants"

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
  const forVerification = billings.filter((b) => b.status === "for_verification")
  const paid = billings.filter((b) => b.status === "paid")

  return [
    { label: "Total Billing", value: formatPeso(sum(billings)), hint: `${billings.length} record${billings.length === 1 ? "" : "s"}`, toneColor: "#02353C" },
    { label: "Pending Payment", value: formatPeso(sum(billings.filter((b) => b.status === "unpaid"))), hint: `${billings.filter((b) => b.status === "unpaid").length} record${billings.filter((b) => b.status === "unpaid").length === 1 ? "" : "s"}`, toneColor: "#F59E0B" },
    { label: "For Verification", value: String(forVerification.length), hint: formatPeso(sum(forVerification)), toneColor: "#3B82F6" },
    { label: "Paid", value: formatPeso(sum(paid)), hint: `${paid.length} record${paid.length === 1 ? "" : "s"}`, toneColor: "#10B981" },
  ]
}

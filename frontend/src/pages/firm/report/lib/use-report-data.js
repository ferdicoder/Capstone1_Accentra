import { useMemo } from "react"

import { clientStore } from "@/components/firm/clients/client-store"
import { useFetchBusinesses } from "@/hooks/useBusinesses"
import { useFetchUsers } from "@/hooks/useUsers"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBillings } from "@/hooks/useBillings"
import { stageLabel } from "@/lib/vocab"

import { ALL, ENGAGEMENT_STATUSES } from "./constants"
import { clientDisplayName, F, fullName } from "./fields"
import {
  byDateDesc,
  byText,
  formatCurrency,
  inRange,
  labelize,
  matchesSearch,
  methodGroup,
  pad,
  paymentGroup,
  uniqueOptions,
} from "./utils"

export function useReportData(f) {
  const businessesQuery = useFetchBusinesses()
  const usersQuery = useFetchUsers()
  const engagementsQuery = useFetchEngagements({ includeTasks: false })
  const billingsQuery = useFetchBillings()
  const overrides = clientStore((state) => state.overrides)

  // --- Source data -----------------------------------------------------------
  const clients = useMemo(
    () =>
      (businessesQuery.data ?? []).map((business) => ({
        ...business,
        ...(overrides[business.id] ?? {}),
        status: overrides[business.id]?.deactivated ? "deactivated" : business.ownerStatus,
      })),
    [businessesQuery.data, overrides]
  )
  const clientsById = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients])
  const clientOptions = useMemo(
    () =>
      clients
        .map((c) => ({ value: String(c.id), label: clientDisplayName(c) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [clients]
  )

  const users = usersQuery.data ?? []
  const engagements = engagementsQuery.data ?? []
  const billings = billingsQuery.data ?? []

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  const engagementsById = useMemo(() => new Map(engagements.map((e) => [e.id, e])), [engagements])
  const userOptions = useMemo(
    () =>
      users
        .map((u) => ({ value: String(u.id), label: F.user.name(u) || F.user.email(u) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [users]
  )

  // --- Billing status per engagement (NEW) ----------------------------------
  // A voided bill releases its engagement, so voided bills are ignored here.
  const billingGroupByEngagement = useMemo(() => {
    const map = new Map()
    billings.forEach((b) => {
      const group = paymentGroup(b.status)
      if (group === "voided") return
      F.billing.engagementIds(b).forEach((id) => map.set(id, group))
    })
    return map
  }, [billings])

  // --- Row sets (computed once per data change) -----------------------------
  const engagementRows = useMemo(
    () =>
      engagements.map((e) => {
        const leadId = F.engagement.leadId(e)
        const leadObject = F.engagement.leadObject(e)
        const leadName =
          (leadObject && (leadObject.name || fullName(leadObject))) ||
          usersById.get(leadId)?.name ||
          e.assignedLeadName ||
          ""
        // Only Completed engagements enter billing; "unbilled" here means Ready to Bill.
        const billing =
          e.status === "completed"
            ? billingGroupByEngagement.get(e.id) ?? "unbilled"
            : e.status === "cancelled"
              ? "not_billable"
              : "not_ready"
        return {
          e,
          id: F.engagement.id(e),
          clientId: F.engagement.businessId(e),
          clientName: F.engagement.businessName(e) || F.engagement.ownerName(e),
          service: e.serviceName ?? "",
          leadId,
          leadName,
          coverage: F.engagement.coverage(e),
          status: e.status,
          billing,
          createdAt: F.engagement.createdAt(e),
        }
      }),
    [engagements, usersById, billingGroupByEngagement]
  )

  const billingRows = useMemo(
    () =>
      billings.map((b) => {
        const linked = F.billing.engagementIds(b).map((id) => engagementsById.get(id)).filter(Boolean)
        const client =
          clientsById.get(F.billing.clientId(b)) ??
          clientsById.get(F.engagement.businessId(linked[0] ?? {})) ??
          null
        const year = b.billing_year
        const month = b.billing_month
        return {
          b,
          id: b.id,
          clientId: client?.id ?? null,
          clientName:
            (client && clientDisplayName(client)) ||
            F.engagement.businessName(linked[0] ?? {}) ||
            "",
          type: F.billing.type(b),
          amount: F.billing.amount(b),
          group: paymentGroup(b.status),
          date: F.billing.date(b),
          period: year && month ? `${year}-${pad(month)}` : "",
          method: F.billing.method(b),
          verifiedAt: F.billing.verifiedAt(b),
        }
      }),
    [billings, engagementsById, clientsById]
  )

  // Client rows with derived columns for the Client List (NEW).
  const clientRows = useMemo(() => {
    const active = new Map()
    engagementRows.forEach((r) => {
      if (r.status === "completed" || r.status === "cancelled") return
      const key = String(r.clientId)
      active.set(key, (active.get(key) ?? 0) + 1)
    })
    // For Verification counts as outstanding until verified (recommended default).
    const owing = new Set(
      billingRows
        .filter((r) => r.group === "unpaid" || r.group === "for_verification")
        .map((r) => String(r.clientId))
    )
    return clients.map((c) => ({
      ...c,
      activeEngagements: active.get(String(c.id)) ?? 0,
      hasOutstanding: owing.has(String(c.id)),
    }))
  }, [clients, engagementRows, billingRows])

  // --- Filter options taken from real data ----------------------------------
  const clientStatusOptions = useMemo(
    () => uniqueOptions(clients.map((c) => c.status), labelize),
    [clients]
  )
  const engagementStatusOptions = useMemo(() => {
    const extra = [...new Set(engagements.map((e) => e.status).filter(Boolean))].filter(
      (s) => !ENGAGEMENT_STATUSES.includes(s)
    )
    return [...ENGAGEMENT_STATUSES, ...extra].map((s) => ({ value: s, label: stageLabel(s) }))
  }, [engagements])
  const serviceOptions = useMemo(
    () => uniqueOptions(engagementRows.map((r) => r.service), (s) => s),
    [engagementRows]
  )

  // --- Filtered rows per report ----------------------------------------------
  const engagementResult = useMemo(
    () =>
      engagementRows
        .filter(
          (r) =>
            inRange(r.createdAt, f.engagements.created) &&
            (f.engagements.status === ALL || r.status === f.engagements.status) &&
            (f.engagements.billing === ALL || r.billing === f.engagements.billing) &&
            (f.engagements.service === ALL || r.service === f.engagements.service) &&
            (f.engagements.client === ALL || String(r.clientId) === f.engagements.client) &&
            (f.engagements.lead === ALL || String(r.leadId) === f.engagements.lead) &&
            (f.engagements.coverage === ALL || r.coverage === f.engagements.coverage)
        )
        .sort(byDateDesc((r) => r.createdAt)),
    [engagementRows, f.engagements]
  )
  const engagementSummary = useMemo(() => {
    const count = (status) => engagementResult.filter((r) => r.status === status).length
    return [
      { label: "Total Engagements", value: engagementResult.length },
      { label: "Document Collection", value: count("document_collection") },
      { label: "For Validation", value: count("for_validation") },
      { label: "In Progress", value: count("in_progress") },
      { label: "Completed", value: count("completed") },
      { label: "Cancelled", value: count("cancelled") },
    ]
  }, [engagementResult])

  const clientResult = useMemo(
    () =>
      clientRows
        .filter(
          (c) =>
            matchesSearch(f.clients.q, F.client.name(c), F.client.businessName(c)) &&
            (f.clients.type === ALL || F.client.type(c) === f.clients.type) &&
            (f.clients.status === ALL || c.status === f.clients.status)
        )
        .sort(byText((c) => F.client.name(c))),
    [clientRows, f.clients]
  )

  const billingResult = useMemo(
    () =>
      billingRows
        .filter(
          (r) =>
            inRange(r.date, f.billing.range) &&
            (f.billing.type === ALL || r.type === f.billing.type) &&
            (f.billing.status === ALL || r.group === f.billing.status) &&
            (f.billing.method === ALL || methodGroup(r.method) === f.billing.method) &&
            (f.billing.client === ALL || String(r.clientId) === f.billing.client)
        )
        .sort(byDateDesc((r) => r.date)),
    [billingRows, f.billing]
  )
  const billingSummary = useMemo(() => {
    const active = billingResult.filter((r) => r.group !== "voided")
    const total = active.reduce((sum, r) => sum + r.amount, 0)
    const count = (group) => billingResult.filter((r) => r.group === group).length
    // Billed totals are not revenue; voided bills are left out of them.
    // Unpaid and For Verification are never counted as paid.
    return [
      { label: "Total Billings", value: billingResult.length },
      { label: "Paid", value: count("paid") },
      { label: "Unpaid", value: count("unpaid") },
      { label: "For Verification", value: count("for_verification") },
      { label: "Voided", value: count("voided") },
      { label: "Total Billed (excl. voided)", value: formatCurrency(total), csv: total.toFixed(2) },
    ]
  }, [billingResult])

  // --- Loading / error per view ---------------------------------------------
  const status = {
    engagements: {
      loading:
        engagementsQuery.isLoading ||
        businessesQuery.isLoading ||
        usersQuery.isLoading ||
        billingsQuery.isLoading,
      error: engagementsQuery.error || billingsQuery.error,
    },
    billing: {
      loading: billingsQuery.isLoading || businessesQuery.isLoading || engagementsQuery.isLoading,
      error: billingsQuery.error,
    },
    clients: {
      loading: businessesQuery.isLoading || engagementsQuery.isLoading || billingsQuery.isLoading,
      error: businessesQuery.error || engagementsQuery.error || billingsQuery.error,
    },
  }

  return {
    status,
    clientOptions,
    userOptions,
    clientStatusOptions,
    engagementStatusOptions,
    serviceOptions,
    engagementResult,
    engagementSummary,
    clientResult,
    billingResult,
    billingSummary,
  }
}
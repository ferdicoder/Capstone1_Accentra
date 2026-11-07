import { useMemo } from "react"

import { clientStore } from "@/components/firm/clients/client-store"
import { useFetchBusinesses } from "@/hooks/useBusinesses"
import { useFetchUsers } from "@/hooks/useUsers"
import { useFetchEngagements } from "@/hooks/useEngagements"
import { useFetchBillings } from "@/hooks/useBillings"
import { stageLabel } from "@/lib/vocab"

import { ALL, CLIENT_TYPE_OPTIONS, ENGAGEMENT_STATUSES, ROLE_LABELS } from "./constants"
import { clientDisplayName, F, fullName } from "./fields"
import {
  byDateDesc,
  byText,
  dateOrUnavailable,
  formatCurrency,
  inRange,
  labelize,
  matchesSearch,
  methodGroup,
  optionLabel,
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
          createdAt: F.engagement.createdAt(e),
          completedAt: F.engagement.completedAt(e),
        }
      }),
    [engagements, usersById]
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
          verifiedBy: F.billing.verifiedBy(b),
        }
      }),
    [billings, engagementsById, clientsById]
  )

  // --- Filter options taken from real data ----------------------------------
  const clientStatusOptions = useMemo(
    () => uniqueOptions(clients.map((c) => c.status), labelize),
    [clients]
  )
  const userRoleOptions = useMemo(
    () => uniqueOptions(users.map((u) => u.role), (r) => ROLE_LABELS[r] ?? labelize(r)),
    [users]
  )
  const userStatusOptions = useMemo(
    () => uniqueOptions(users.map((u) => u.status), labelize),
    [users]
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
            inRange(r.completedAt, f.engagements.completed) &&
            (f.engagements.status === ALL || r.status === f.engagements.status) &&
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
      clients
        .filter(
          (c) =>
            matchesSearch(f.clients.q, F.client.name(c), F.client.businessName(c)) &&
            (f.clients.type === ALL || F.client.type(c) === f.clients.type) &&
            (f.clients.status === ALL || c.status === f.clients.status)
        )
        .sort(byText((c) => F.client.name(c))),
    [clients, f.clients]
  )

  const userResult = useMemo(
    () =>
      users
        .filter(
          (u) =>
            matchesSearch(f.users.q, F.user.name(u), F.user.email(u)) &&
            (f.users.role === ALL || u.role === f.users.role) &&
            (f.users.status === ALL || u.status === f.users.status) &&
            inRange(F.user.createdAt(u), f.users.created)
        )
        .sort(byText((u) => F.user.name(u))),
    [users, f.users]
  )

  const billingResult = useMemo(
    () =>
      billingRows
        .filter(
          (r) =>
            inRange(r.date, f.billing.range) &&
            (f.billing.type === ALL || r.type === f.billing.type) &&
            (f.billing.status === ALL || r.group === f.billing.status) &&
            (f.billing.client === ALL || String(r.clientId) === f.billing.client)
        )
        .sort(byDateDesc((r) => r.date)),
    [billingRows, f.billing]
  )
  const billingSummary = useMemo(() => {
    const active = billingResult.filter((r) => r.group !== "voided")
    const sum = (list) => list.reduce((total, r) => total + r.amount, 0)
    const count = (group) => billingResult.filter((r) => r.group === group).length
    const money = (n) => ({ value: formatCurrency(n), csv: n.toFixed(2) })
    // Billed totals are not revenue; voided invoices are left out of them.
    return [
      { label: "Total Billings", value: billingResult.length },
      { label: "Total Billed Amount (excl. voided)", ...money(sum(active)) },
      { label: "Service Fee Billed", ...money(sum(active.filter((r) => r.type === "service_fee"))) },
      { label: "Retainer Fee Billed", ...money(sum(active.filter((r) => r.type === "retainer_fee"))) },
      { label: "Paid Billings", value: count("paid") },
      { label: "Unpaid Billings", value: count("unpaid") },
      { label: "For Verification Billings", value: count("for_verification") },
      { label: "Voided Billings", value: count("voided") },
    ]
  }, [billingResult])

  const paymentResult = useMemo(
    () =>
      billingRows
        .filter(
          (r) =>
            (f.payments.type === ALL || r.type === f.payments.type) &&
            (f.payments.status === ALL || r.group === f.payments.status) &&
            (f.payments.method === ALL || methodGroup(r.method) === f.payments.method) &&
            (f.payments.client === ALL || String(r.clientId) === f.payments.client) &&
            inRange(r.verifiedAt, f.payments.verified)
        )
        .sort(byDateDesc((r) => r.date)),
    [billingRows, f.payments]
  )
  const paymentSummary = useMemo(() => {
    const of = (group) => paymentResult.filter((r) => r.group === group)
    const sum = (list) => list.reduce((total, r) => total + r.amount, 0)
    const money = (n) => ({ value: formatCurrency(n), csv: n.toFixed(2) })
    // Unpaid and For Verification are never counted as completed payments.
    return [
      { label: "Total Paid Billings", value: of("paid").length },
      { label: "Total Paid Amount", ...money(sum(of("paid"))) },
      { label: "Total Unpaid Billings", value: of("unpaid").length },
      { label: "Total Amount Awaiting Payment", ...money(sum(of("unpaid"))) },
      { label: "Billings Awaiting Verification", value: of("for_verification").length },
    ]
  }, [paymentResult])

  // --- Record views ----------------------------------------------------------
  const selectedClient =
    f.clientRecord.client === ALL
      ? null
      : clients.find((c) => String(c.id) === f.clientRecord.client) ?? null
  const clientInfoRows = selectedClient
    ? [
        { label: "Client ID", value: F.client.id(selectedClient) },
        { label: "Client Name", value: F.client.name(selectedClient) },
        { label: "Email Address", value: F.client.email(selectedClient) },
        { label: "Business Name", value: F.client.businessName(selectedClient) },
        { label: "Client Type", value: optionLabel(CLIENT_TYPE_OPTIONS, F.client.type(selectedClient)) },
        { label: "Account Status", value: labelize(selectedClient.status) },
        { label: "Registration Date", value: dateOrUnavailable(F.client.registeredAt(selectedClient)) },
      ]
    : []
  const clientEngagementRows = useMemo(
    () =>
      selectedClient
        ? engagementRows
            .filter((r) => String(r.clientId) === String(selectedClient.id))
            .sort(byDateDesc((r) => r.createdAt))
        : [],
    [engagementRows, selectedClient]
  )
  const clientPaymentRows = useMemo(
    () =>
      selectedClient
        ? billingRows
            .filter((r) => String(r.clientId) === String(selectedClient.id))
            .sort(byDateDesc((r) => r.date))
        : [],
    [billingRows, selectedClient]
  )

  const selectedUser =
    f.userRecord.user === ALL
      ? null
      : users.find((u) => String(u.id) === f.userRecord.user) ?? null
  const userInfoRows = selectedUser
    ? [
        { label: "User ID", value: F.user.id(selectedUser) },
        { label: "Full Name", value: F.user.name(selectedUser) },
        { label: "Email Address", value: F.user.email(selectedUser) },
        { label: "Firm Role", value: ROLE_LABELS[selectedUser.role] ?? labelize(selectedUser.role) },
        { label: "Account Status", value: labelize(selectedUser.status) },
        { label: "Date Created", value: dateOrUnavailable(F.user.createdAt(selectedUser)) },
      ]
    : []
  const assignedRows = useMemo(
    () =>
      selectedUser
        ? engagementRows
            .filter((r) => String(r.leadId) === String(selectedUser.id))
            .sort(byDateDesc((r) => r.createdAt))
        : [],
    [engagementRows, selectedUser]
  )

  // --- Loading / error per view ---------------------------------------------
  const status = {
    engagements: {
      loading: engagementsQuery.isLoading || businessesQuery.isLoading || usersQuery.isLoading,
      error: engagementsQuery.error,
    },
    clients: { loading: businessesQuery.isLoading, error: businessesQuery.error },
    clientRecord: {
      loading: businessesQuery.isLoading || engagementsQuery.isLoading || billingsQuery.isLoading,
      error: businessesQuery.error || engagementsQuery.error || billingsQuery.error,
    },
    users: { loading: usersQuery.isLoading, error: usersQuery.error },
    userRecord: {
      loading: usersQuery.isLoading || engagementsQuery.isLoading || businessesQuery.isLoading,
      error: usersQuery.error || engagementsQuery.error,
    },
    billing: {
      loading: billingsQuery.isLoading || businessesQuery.isLoading || engagementsQuery.isLoading,
      error: billingsQuery.error,
    },
    payments: {
      loading: billingsQuery.isLoading || businessesQuery.isLoading || engagementsQuery.isLoading,
      error: billingsQuery.error,
    },
  }

  return {
    status,
    // dropdown options
    clientOptions,
    userOptions,
    clientStatusOptions,
    userRoleOptions,
    userStatusOptions,
    engagementStatusOptions,
    serviceOptions,
    // filtered results and summaries
    engagementResult,
    engagementSummary,
    clientResult,
    userResult,
    billingResult,
    billingSummary,
    paymentResult,
    paymentSummary,
    // record views
    selectedClient,
    clientInfoRows,
    clientEngagementRows,
    clientPaymentRows,
    selectedUser,
    userInfoRows,
    assignedRows,
  }
}
import { normalize } from "./utils"

// ---------------------------------------------------------------------------
// FIELD MAP: the only place that knows API field names. Names marked VERIFY
// are guesses; change them here if your responses differ.
// ---------------------------------------------------------------------------
export const fullName = (person) =>
  [person?.firstName, person?.middleName, person?.lastName, person?.extension]
    .filter(Boolean)
    .join(" ")

export const asObject = (value) => (value && typeof value === "object" ? value : null)

export const F = {
  client: {
    id: (c) => c.id,
    name: (c) => fullName(c),
    businessName: (c) => c.businessName ?? c.business?.businessName ?? "",
    email: (c) => c.email ?? "",
    type: (c) => c.clientType ?? c.business?.clientType ?? "",
    registeredAt: (c) => c.createdAt ?? c.created_at ?? null, // VERIFY
  },
  user: {
    id: (u) => u.id,
    name: (u) => u.name || fullName(u),
    email: (u) => u.email ?? "",
    createdAt: (u) => u.createdAt ?? u.created_at ?? null, // VERIFY
  },
  engagement: {
    id: (e) => e.engagementNumber ?? e.id,
    businessId: (e) => e.business?.id ?? e.businessId ?? null,
    businessName: (e) => e.business?.businessName ?? "",
    ownerName: (e) => fullName(e.client),
    createdAt: (e) => e.createdAt ?? e.created_at ?? null,
    // No fallback to updatedAt: a completion date is never inferred.
    completedAt: (e) => e.completedAt ?? e.completed_at ?? null, // VERIFY
    coverage: (e) => e.coverageType ?? e.coverage_type ?? "", // VERIFY
    // The assigned lead may come back as an object or as a plain id.
    leadObject: (e) => asObject(e.assignedLead ?? e.assignedStaff ?? e.lead), // VERIFY
    leadId: (e) =>
      asObject(e.assignedLead ?? e.assignedStaff ?? e.lead)?.id ??
      e.assignedLeadId ??
      e.assigned_lead_id ??
      e.assignedStaffId ??
      null, // VERIFY
    assignedAt: (e) => e.assignedAt ?? e.assigned_at ?? null, // VERIFY
  },
  billing: {
    clientId: (b) => b.business_id ?? b.client_id ?? null,
    type: (b) => b.invoice_type ?? b.billing_type ?? "",
    date: (b) => b.invoiceDate ?? b.createdAt ?? b.created_at ?? null, // VERIFY
    amount: (b) => Number(b.amount) || 0, // saved invoice amount, never recalculated
    engagementIds: (b) =>
      b.engagement_ids?.length ? b.engagement_ids : b.engagement_id ? [b.engagement_id] : [],
    payment: (b) =>
      b.payments?.find((p) => normalize(p.status) === "verified") ?? b.payments?.[0] ?? null, // VERIFY
    method: (b) => {
      const p = F.billing.payment(b)
      return p?.payment_method ?? p?.paymentMethod ?? p?.method ?? b.payment_method ?? b.paymentMethod ?? ""
    }, // VERIFY
    verifiedAt: (b) => {
      const p = F.billing.payment(b)
      return p?.verified_at ?? p?.verifiedAt ?? b.payment_verified_at ?? null
    }, // VERIFY
    verifiedBy: (b) => {
      const p = F.billing.payment(b)
      return (
        p?.verified_by_name ??
        p?.verifiedByName ??
        p?.verifiedBy?.name ??
        asObject(p?.verified_by)?.name ??
        ""
      )
    }, // VERIFY
  },
}

export const clientDisplayName = (c) => F.client.businessName(c) || F.client.name(c)
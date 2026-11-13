import { supabase } from "@/config/supabase"
import { apiBaseUrl } from "@/config/api"
import { normalizeBillingStatus } from "@/components/firm/billing/billing-variants"

const BILLING_SELECT = `
  billing_id, billing_code, business_id, billing_type, total_amount, status, remark, due_date, created_at,
  billing_month, billing_year,
  businesses(retainer_fee),
  billing_engagements(billing_id, engagement_id, amount, service_name, is_active),
  payments(
    payment_id, billing_id, amount, payment_method, reference_id, paid_at, verified_at,
    payment_proofs(file_id, files(file_name, mime_type, file_size, created_at))
  )
`

// payment_proofs is a junction row — file metadata lives in the embedded
// `files` record (which also carries created_at).
function getPaymentCreatedAt(payment) {
  return Math.max(
    ...(payment.payment_proofs ?? []).map((proof) =>
      new Date(proof.files?.created_at ?? 0).getTime()
    ),
    0
  )
}

function getLatestPaymentDocument(payment) {
  return [...(payment?.payment_proofs ?? [])]
    .sort((first, second) =>
      new Date(second.files?.created_at ?? 0) - new Date(first.files?.created_at ?? 0)
    )[0]?.files ?? null
}

function mapBilling(row) {
  const allLinks = row.billing_engagements ?? []
  const activeLinks = allLinks.filter((link) => link.is_active !== false)
  const payments = row.payments ?? []
  const payment = [...payments].sort(
    (first, second) => getPaymentCreatedAt(second) - getPaymentCreatedAt(first)
  )[0] ?? null
  // When the client submitted the proof — the newest proof file's timestamp.
  const paymentSubmittedAt = payment ? getPaymentCreatedAt(payment) : 0
  return {
    ...row,
    id: row.billing_id,
    billingCode: row.billing_code ?? null,
    status: normalizeBillingStatus(row.status),
    remark: row.remark ?? null,
    invoice_type: row.billing_type,
    amount: Number(row.total_amount ?? 0),
    retainerFee: row.businesses?.retainer_fee != null
      ? Number(row.businesses.retainer_fee)
      : null,
    engagement_id: allLinks[0]?.engagement_id ?? null,
    engagement_ids: allLinks.map((link) => link.engagement_id),
    active_engagement_ids: activeLinks.map((link) => link.engagement_id),
    payment_method: payment?.payment_method ?? null,
    reference_id: payment?.reference_id ?? null,
    payment_proof_url: payment?.payment_proofs?.length
      ? `${apiBaseUrl}/payments/${payment.payment_id}/proof`
      : null,
    payment_proof_name: getLatestPaymentDocument(payment)?.file_name ?? null,
    payment_proof_size: getLatestPaymentDocument(payment)?.file_size ?? null,
    payment_id: payment?.payment_id ?? null,
    paymentSubmittedAt: paymentSubmittedAt
      ? new Date(paymentSubmittedAt).toISOString()
      : null,
    billing_month: row.billing_month ?? null,
    billing_year: row.billing_year ?? null,
  }
}

export async function getBillings() {
  const { data, error } = await supabase
    .from("billings")
    .select(BILLING_SELECT)
    .order("due_date", { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapBilling)
}

export async function getBilling(id) {
  const { data, error } = await supabase
  .from("billings")
  .select(BILLING_SELECT)
  .eq("billing_id", id)
  .single()

  if (error) throw error
  return mapBilling(data)
}

export async function getBusinessBillings(businessId) {
  const { data, error } = await supabase
    .from("billings")
    .select(BILLING_SELECT)
    .eq("business_id", businessId)
    .order("due_date", { ascending: false })
    
  if (error) throw error
  return (data ?? []).map(mapBilling)
}

export async function createBilling({
  invoice_type,
  amount,
  due_date,
  client_id,
  billing_month = null,
  billing_year = null,
  engagement_ids = [],
  engagement_amounts = {},
  engagements = [],
}) {
  const isRetainer = invoice_type === "retainer_fee"
  const isServiceFee = invoice_type === "service_fee"

  if (!isRetainer && !isServiceFee) {
    throw new Error("Invalid billing type.")
  }

  // Service Fee needs engagements; Retainer Fee does not (they are only
  // for traceability and never change the amount).
  if (isServiceFee && engagement_ids.length === 0) {
    throw new Error("At least one engagement is required for a service fee billing.")
  }
  if (isRetainer && (!client_id || !billing_month || !billing_year)) {
    throw new Error("Retainer fee billing requires a client and a billing period.")
  }

  const selectedEngagements = engagement_ids.map((engagementId) =>
    engagements.find((engagement) => engagement.id === engagementId)
  )
  if (selectedEngagements.some((engagement) => !engagement || engagement.status !== "completed")) {
    throw new Error("Billing can only be created for completed engagements.")
  }

  const businessId = isRetainer
    ? client_id
    : selectedEngagements[0]?.business?.id || client_id

  if (!businessId) throw new Error("A business is required to create billing.")

  const { data: billing, error } = await supabase
    .from("billings")
    .insert({
      business_id: businessId,
      billing_type: invoice_type,
      total_amount: amount,
      due_date,
      status: "pending",
      billing_month: isRetainer ? Number(billing_month) : null,
      billing_year: isRetainer ? Number(billing_year) : null,
    })
    .select("billing_id")
    .single()

  if (error) {
    // 23505 = unique violation from uniq_retainer_per_month
    if (error.code === "23505") {
      throw new Error("A retainer fee billing already exists for this client and period.")
    }
    throw error
  }

  // Only link engagements when there are some (retainer bills may have none).
  if (engagement_ids.length > 0) {
    const rows = engagement_ids.map((engagementId, index) => ({
      billing_id: billing.billing_id,
      engagement_id: engagementId,
      // Retainer: the bill amount is fixed, so don't give lines a value.
      amount: isRetainer
        ? 0
        : Number(engagement_amounts[engagementId] ?? amount),
      service_name: selectedEngagements[index]?.serviceName ?? null,
    }))
    const { error: linkError } = await supabase.from("billing_engagements").insert(rows)
    if (linkError) {
      await supabase.from("billings").delete().eq("billing_id", billing.billing_id)
      throw new Error(`Billing created but engagement links failed; the billing was rolled back. ${linkError.message}`)
    }
  }

  return getBilling(billing.billing_id)
}
export async function updateBillingStatus({ id, status, remark }) {
  const update = { status }
  if (remark !== undefined) update.remark = remark

  const { data, error } = await supabase
    .from("billings").update(update)
    .eq("billing_id", id)
    .select(BILLING_SELECT)
    .single()

  if (error) throw error
  return mapBilling(data)
}

export async function createPayment({ billingId, amount, paymentMethod }) {
  const { data, error } = await supabase
    .from("payments")
    .insert({
      billing_id: billingId,
      amount,
      payment_method: paymentMethod,
      paid_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadPaymentProof(file, billingId, paymentMethod, uploadedBy) {
  const formData = new FormData()
  formData.append("document", file)
  formData.append("paymentMethod", paymentMethod)
  if (uploadedBy) formData.append("uploadedBy", uploadedBy)

  const response = await fetch(
    `${apiBaseUrl}/payments/${billingId}`,
    { method: "POST", body: formData }
  )
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || "Payment submission failed")
  }
  return response.json()
}

export async function updatePaymentStatus({
  paymentId,
  billingId,
  status,
  remark,
  referenceId,
}) {
  let data = paymentId ? { payment_id: paymentId } : null
  const paymentUpdate = {}

  if (paymentId && referenceId !== undefined) {
    const normalizedReferenceId = String(referenceId)
      .replace(/[^a-zA-Z0-9-]/g, "")
      .toUpperCase()
    paymentUpdate.reference_id = normalizedReferenceId || null
  }
  if (status === "verified") {
    paymentUpdate.verified_at = new Date().toISOString()
  }

  if (paymentId && Object.keys(paymentUpdate).length > 0) {
    const { data: updatedPayment, error } = await supabase
      .from("payments")
      .update(paymentUpdate)
      .eq("payment_id", paymentId)
      .select()
      .single()

    if (error) throw error
    data = updatedPayment
  }

  if (billingId && status) {
    const nextStatus = {
      verified: "paid",
      rejected: "for resubmission",
      refunded: "pending",
    }[status]
    if (nextStatus) {
      const billingUpdate = { id: billingId, status: nextStatus }
      if (status === "rejected") {
        billingUpdate.remark = remark?.trim() || null
      } else if (status === "verified") {
        billingUpdate.remark = null
      }
      await updateBillingStatus(billingUpdate)
    }
  }
  return data
}

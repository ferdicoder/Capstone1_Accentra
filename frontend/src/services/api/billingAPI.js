import { supabase } from "@/config/supabase"

const BILLING_SELECT = `
  billing_id, business_id, billing_type, total_amount, status, due_date,
  billing_engagements(billing_id, engagement_id, amount, service_name),
  payments(payment_id, billing_id, amount, payment_method, proof_url, reference_id, status)
`

function mapBilling(row) {
  const links = row.billing_engagements ?? []
  const payments = row.payments ?? []
  const payment = payments[0] ?? null
  return {
    ...row,
    id: row.billing_id,
    invoice_type: row.billing_type,
    amount: Number(row.total_amount ?? 0),
    engagement_id: links[0]?.engagement_id ?? null,
    engagement_ids: links.map((link) => link.engagement_id),
    payment_method: payment?.payment_method ?? null,
    payment_proof_url: payment?.proof_url ?? null,
    payment_reference: payment?.reference_id ?? null,
    payment_status: payment?.status ?? null,
    billing_month: null,
    billing_year: null,
  }
}

export async function getBillings() {
  const { data, error } = await supabase.from("billings").select(BILLING_SELECT).order("due_date", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapBilling)
}

export async function getBilling(id) {
  const { data, error } = await supabase.from("billings").select(BILLING_SELECT).eq("billing_id", id).single()
  if (error) throw error
  return mapBilling(data)
}

export async function getBusinessBillings(businessId) {
  const { data, error } = await supabase.from("billings").select(BILLING_SELECT).eq("business_id", businessId).order("due_date", { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapBilling)
}

export async function createBilling({ invoice_type, amount, due_date, client_id, engagement_ids = [], engagement_amounts = {}, engagements = [] }) {
  const businessId = client_id || engagements.find((e) => engagement_ids.includes(e.id))?.business?.id
  if (!businessId) throw new Error("A business is required to create billing.")
  const { data: billing, error } = await supabase.from("billings").insert({
    business_id: businessId,
    billing_type: invoice_type,
    total_amount: amount,
    due_date,
    status: "issued",
  }).select("billing_id").single()
  if (error) throw error

  const rows = engagement_ids.map((engagementId) => {
    const engagement = engagements.find((item) => item.id === engagementId)
    return {
      billing_id: billing.billing_id,
      engagement_id: engagementId,
      amount: Number(engagement_amounts[engagementId] ?? amount),
      service_name: engagement?.serviceName ?? null,
    }
  })
  if (rows.length) {
    const { error: linkError } = await supabase.from("billing_engagements").insert(rows)
    if (linkError) {
      await supabase.from("billings").delete().eq("billing_id", billing.billing_id)
      throw new Error(`Billing created but engagement links failed; the billing was rolled back. ${linkError.message}`)
    }
  }
  return getBilling(billing.billing_id)
}

export async function updateBillingStatus({ id, status }) {
  const { data, error } = await supabase.from("billings").update({ status }).eq("billing_id", id).select(BILLING_SELECT).single()
  if (error) throw error
  return mapBilling(data)
}

export async function createPayment({ billingId, amount, paymentMethod, proofUrl = null, referenceId = null }) {
  const { data, error } = await supabase.from("payments").insert({
    billing_id: billingId, amount, payment_method: paymentMethod, proof_url: proofUrl,
    reference_id: referenceId, status: "pending",
  }).select().single()
  if (error) throw error
  return data
}

export async function updatePaymentStatus({ paymentId, billingId, status, referenceId }) {
  const { data, error } = await supabase.from("payments").update({ status, reference_id: referenceId ?? undefined }).eq("payment_id", paymentId).select().single()
  if (error) throw error
  if (billingId && (status === "verified" || status === "rejected" || status === "refunded")) {
    const billing = await getBilling(billingId)
    const verifiedTotal = (billing.payments ?? [])
      .filter((payment) => payment.status === "verified")
      .reduce((total, payment) => total + Number(payment.amount || 0), 0)
    const nextStatus =
      status === "refunded"
        ? "issued"
        : verifiedTotal >= Number(billing.total_amount ?? billing.amount ?? 0)
          ? "paid"
          : "issued"
    await updateBillingStatus({ id: billingId, status: nextStatus })
  }
  return data
}

export async function uploadPaymentProof(file, billingId) {
  const path = `billing/${billingId}/${crypto.randomUUID()}-${file.name}`
  const { error } = await supabase.storage.from("payment-proofs").upload(path, file, { upsert: false })
  if (error) throw new Error(`Payment proof upload failed. Check that the payment-proofs bucket exists. ${error.message}`)
  const { data } = supabase.storage.from("payment-proofs").getPublicUrl(path)
  return data.publicUrl
}

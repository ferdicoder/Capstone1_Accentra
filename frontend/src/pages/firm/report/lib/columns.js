import { stageLabel } from "@/lib/vocab"
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COVERAGE_OPTIONS,
  ENGAGEMENT_BILLING_OPTIONS,
  PAYMENT_STATUS_LABELS,
  UNAVAILABLE,
} from "./constants"
import { F } from "./fields"
import { dateOrUnavailable, formatCurrency, labelize, methodLabel, optionLabel } from "./utils"

// Shared by the on-screen table, the CSV and the PDF.
export const summaryColumns = [
  { label: "Measure", value: (r) => r.label },
  { label: "Value", value: (r) => r.csv ?? r.value },
]

// Billing status shown on the Engagement Report. Only Completed engagements
// can be billed, so the other stages get an explicit label instead of "Unbilled".
const BILLING_STATUS_LABELS = {
  ...Object.fromEntries(ENGAGEMENT_BILLING_OPTIONS.map((o) => [o.value, o.label])),
  not_ready: "Not yet billable",
  not_billable: "Not billable",
}

export const engagementColumns = [
  { label: "Engagement ID", value: (r) => r.id },
  { label: "Client Name", value: (r) => r.clientName },
  { label: "Service Name", value: (r) => r.service },
  { label: "Assigned Firm User", value: (r) => r.leadName },
  { label: "Coverage Type", value: (r) => optionLabel(COVERAGE_OPTIONS, r.coverage) },
  { label: "Engagement Status", value: (r) => stageLabel(r.status) },
  { label: "Billing Status", value: (r) => BILLING_STATUS_LABELS[r.billing] ?? "" }, // NEW
  { label: "Date Created", value: (r) => dateOrUnavailable(r.createdAt) },
  { label: "Completion Date", value: (r) => dateOrUnavailable(r.completedAt) },
]

// Retainer Charge only applies to Retainer clients. Verify the field name
// against your businesses payload (retainerCharge / retainer_charge).
const retainerCharge = (c) => {
  const raw = c.retainerCharge ?? c.retainer_charge
  if (raw == null || F.client.type(c) !== "retainer") return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export const clientListColumns = [
  { label: "Client ID", value: (c) => F.client.id(c) },
  { label: "Client Name", value: (c) => F.client.name(c) },
  { label: "Email Address", value: (c) => F.client.email(c) },
  { label: "Business Name", value: (c) => F.client.businessName(c) },
  { label: "Client Type", value: (c) => optionLabel(CLIENT_TYPE_OPTIONS, F.client.type(c)) },
  {
    label: "Retainer Charge (PHP)", // NEW
    value: (c) => {
      const n = retainerCharge(c)
      return n == null ? "" : n.toFixed(2)
    },
    display: (c) => {
      const n = retainerCharge(c)
      return n == null ? "—" : formatCurrency(n)
    },
  },
  { label: "Active Engagements", value: (c) => c.activeEngagements ?? 0 }, // NEW
  { label: "Outstanding Bill", value: (c) => (c.hasOutstanding ? "Yes" : "No") }, // NEW
  { label: "Account Status", value: (c) => labelize(c.status) },
  { label: "Registration Date", value: (c) => dateOrUnavailable(F.client.registeredAt(c)) },
]

// Billing Report = old Billing Summary + Payment Monitoring merged.
// Payment fields only apply once a bill is Paid.
export const billingColumns = [
  { label: "Billing ID", value: (r) => r.id },
  { label: "Client Name", value: (r) => r.clientName },
  { label: "Billing Type", value: (r) => optionLabel(BILLING_TYPE_OPTIONS, r.type) },
  { label: "Billing Amount (PHP)", value: (r) => r.amount.toFixed(2), display: (r) => formatCurrency(r.amount) },
  { label: "Billing Date", value: (r) => dateOrUnavailable(r.date) },
  { label: "Billing Month and Year", value: (r) => r.period },
  { label: "Billing Status", value: (r) => PAYMENT_STATUS_LABELS[r.group] },
  { label: "Payment Method", value: (r) => (r.group === "paid" ? methodLabel(r.method) || UNAVAILABLE : "") }, // NEW
  { label: "Date Paid", value: (r) => (r.group === "paid" ? dateOrUnavailable(r.verifiedAt) : "") }, // NEW
]
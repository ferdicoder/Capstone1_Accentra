import { stageLabel } from "@/lib/vocab"
import {
  BILLING_TYPE_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  COVERAGE_OPTIONS,
  PAYMENT_STATUS_LABELS,
  ROLE_LABELS,
  UNAVAILABLE,
} from "./constants"
import { F } from "./fields"
import { dateOrUnavailable, formatCurrency, labelize, methodLabel, optionLabel } from "./utils"

// Shared by the on-screen table, the CSV and the PDF.
export const summaryColumns = [
  { label: "Measure", value: (r) => r.label },
  { label: "Value", value: (r) => r.csv ?? r.value },
]
export const infoColumns = [
  { label: "Field", value: (r) => r.label },
  { label: "Value", value: (r) => r.value },
]

export const engagementColumns = [
  { label: "Engagement ID", value: (r) => r.id },
  { label: "Client Name", value: (r) => r.clientName },
  { label: "Service Name", value: (r) => r.service },
  { label: "Assigned Firm User", value: (r) => r.leadName },
  { label: "Coverage Type", value: (r) => optionLabel(COVERAGE_OPTIONS, r.coverage) },
  { label: "Engagement Status", value: (r) => stageLabel(r.status) },
  { label: "Date Created", value: (r) => dateOrUnavailable(r.createdAt) },
  { label: "Completion Date", value: (r) => dateOrUnavailable(r.completedAt) },
]

export const clientListColumns = [
  { label: "Client ID", value: (c) => F.client.id(c) },
  { label: "Client Name", value: (c) => F.client.name(c) },
  { label: "Email Address", value: (c) => F.client.email(c) },
  { label: "Business Name", value: (c) => F.client.businessName(c) },
  { label: "Client Type", value: (c) => optionLabel(CLIENT_TYPE_OPTIONS, F.client.type(c)) },
  { label: "Account Status", value: (c) => labelize(c.status) },
  { label: "Registration Date", value: (c) => dateOrUnavailable(F.client.registeredAt(c)) },
]

export const userListColumns = [
  { label: "User ID", value: (u) => F.user.id(u) },
  { label: "Full Name", value: (u) => F.user.name(u) },
  { label: "Email Address", value: (u) => F.user.email(u) },
  { label: "Firm Role", value: (u) => ROLE_LABELS[u.role] ?? labelize(u.role) },
  { label: "Account Status", value: (u) => labelize(u.status) },
  { label: "Date Created", value: (u) => dateOrUnavailable(F.user.createdAt(u)) },
]

export const billingColumns = [
  { label: "Billing ID", value: (r) => r.id },
  { label: "Client Name", value: (r) => r.clientName },
  { label: "Billing Type", value: (r) => optionLabel(BILLING_TYPE_OPTIONS, r.type) },
  { label: "Billing Amount (PHP)", value: (r) => r.amount.toFixed(2), display: (r) => formatCurrency(r.amount) },
  { label: "Billing Date", value: (r) => dateOrUnavailable(r.date) },
  { label: "Billing Month and Year", value: (r) => r.period },
  { label: "Billing Status", value: (r) => PAYMENT_STATUS_LABELS[r.group] },
]

export const paymentColumns = [
  { label: "Billing ID", value: (r) => r.id },
  { label: "Client Name", value: (r) => r.clientName },
  { label: "Billing Type", value: (r) => optionLabel(BILLING_TYPE_OPTIONS, r.type) },
  { label: "Billing Amount (PHP)", value: (r) => r.amount.toFixed(2), display: (r) => formatCurrency(r.amount) },
  {
    label: "Payment Method",
    value: (r) => (r.group === "paid" ? methodLabel(r.method) || UNAVAILABLE : ""),
  },
  { label: "Payment Status", value: (r) => PAYMENT_STATUS_LABELS[r.group] },
  { label: "Billing Date", value: (r) => dateOrUnavailable(r.date) },
  {
    label: "Payment Verification Date",
    value: (r) => (r.group === "paid" ? dateOrUnavailable(r.verifiedAt) : ""),
  },
  { label: "Verified By", value: (r) => (r.group === "paid" ? r.verifiedBy || UNAVAILABLE : "") },
]

// Client Record: engagement history and payment history sections.
export const clientEngagementColumns = [
  { label: "Engagement ID", value: (r) => r.id },
  { label: "Service Name", value: (r) => r.service },
  { label: "Date Created", value: (r) => dateOrUnavailable(r.createdAt) },
  { label: "Assigned Firm User", value: (r) => r.leadName },
  { label: "Coverage Type", value: (r) => optionLabel(COVERAGE_OPTIONS, r.coverage) },
  { label: "Current Engagement Status", value: (r) => stageLabel(r.status) },
  { label: "Completion Date", value: (r) => dateOrUnavailable(r.completedAt) },
]
export const clientPaymentColumns = [
  { label: "Billing ID", value: (r) => r.id },
  { label: "Billing Type", value: (r) => optionLabel(BILLING_TYPE_OPTIONS, r.type) },
  { label: "Billing Month and Year", value: (r) => r.period },
  // Saved invoice amount, not the client's current Retainer Charge.
  { label: "Billing Amount (PHP)", value: (r) => r.amount.toFixed(2), display: (r) => formatCurrency(r.amount) },
  { label: "Billing Date", value: (r) => dateOrUnavailable(r.date) },
  { label: "Payment Status", value: (r) => PAYMENT_STATUS_LABELS[r.group] },
  { label: "Payment Method", value: (r) => (r.group === "paid" ? methodLabel(r.method) || UNAVAILABLE : "") },
  {
    label: "Payment Verification Date",
    value: (r) => (r.group === "paid" ? dateOrUnavailable(r.verifiedAt) : ""),
  },
]

// Firm User Record: currently assigned engagements only.
export const assignedEngagementColumns = [
  { label: "Engagement ID", value: (r) => r.id },
  { label: "Client Name", value: (r) => r.clientName },
  { label: "Service Name", value: (r) => r.service },
  { label: "Date Assigned", value: (r) => dateOrUnavailable(F.engagement.assignedAt(r.e)) },
  { label: "Current Engagement Status", value: (r) => stageLabel(r.status) },
  { label: "Completion Date", value: (r) => dateOrUnavailable(r.completedAt) },
]
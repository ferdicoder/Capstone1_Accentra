import { billingStatusLabels } from "./billing-variants"

export const mockEngagements = [
  {
    id: "MOCK-ENG-001",
    engagementNumber: "DEMO-ENG-001",
    serviceName: "Annual Tax Filing",
    status: "in_progress",
    client: { firstName: "Alex", lastName: "Sample" },
    business: { businessName: "Example Trading Co." },
  },
  {
    id: "MOCK-ENG-002",
    engagementNumber: "DEMO-ENG-002",
    serviceName: "Quarterly VAT Filing",
    status: "for_approval",
    client: { firstName: "Taylor", lastName: "Demo" },
    business: { businessName: "Sample Goods Inc." },
  },
  {
    id: "MOCK-ENG-003",
    engagementNumber: "DEMO-ENG-003",
    serviceName: "Business Registration",
    status: "payment",
    client: { firstName: "Casey", lastName: "Example" },
    business: { businessName: "Mock Ventures Ltd." },
  },
]

let mockBillings = [
  {
    id: "BILL-MOCK-0001",
    engagement_id: "MOCK-ENG-001",
    invoice_type: "initial",
    amount: 2500,
    status: "unpaid",
    payment_reference: "",
    due_date: "2026-11-15",
  },
  {
    id: "BILL-MOCK-0002",
    engagement_id: "MOCK-ENG-002",
    invoice_type: "retainer",
    amount: 5000,
    status: "for_verification",
    payment_reference: "DEMO-GCASH-0002",
    due_date: "2026-11-08",
  },
  {
    id: "BILL-MOCK-0003",
    engagement_id: "MOCK-ENG-003",
    invoice_type: "final",
    amount: 8750.5,
    status: "paid",
    payment_reference: "DEMO-BANK-0003",
    due_date: "2026-10-20",
  },
]

let nextBillingNumber = 4

export function getMockBillings() {
  return mockBillings
}

export function createMockBilling({ engagement_id, invoice_type, amount, due_date }) {
  const record = {
    id: `BILL-MOCK-${String(nextBillingNumber).padStart(4, "0")}`,
    engagement_id,
    invoice_type,
    amount,
    status: "unpaid",
    payment_reference: "",
    due_date,
  }
  nextBillingNumber += 1
  mockBillings = [record, ...mockBillings]
  return record
}

export function updateMockBillingStatus(id, status) {
  if (!Object.hasOwn(billingStatusLabels, status)) return false

  let updated = false
  mockBillings = mockBillings.map((billing) => {
    if (billing.id !== id || billing.status === status) return billing
    updated = true
    return { ...billing, status }
  })
  return updated
}

export function verifyMockPayment(id) {
  const billing = mockBillings.find((record) => record.id === id)
  if (billing?.status !== "for_verification" || !billing.payment_reference) return false
  return updateMockBillingStatus(id, "paid")
}

export function rejectMockPayment(id) {
  let updated = false
  mockBillings = mockBillings.map((billing) => {
    if (billing.id !== id || billing.status !== "for_verification") return billing
    updated = true
    return { ...billing, status: "unpaid", payment_reference: "" }
  })
  return updated
}
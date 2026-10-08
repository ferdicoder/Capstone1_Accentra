import { billingStatusLabels } from "./billing-variants"

export const mockClients = [
  {
    id: "client-001",
    firstName: "Maria",
    lastName: "Santos",
    email: "maria.santos@example.com",
    business: {
      businessName: "Santos Retail Trading",
    },
  },
  {
    id: "client-002",
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "juan.delacruz@example.com",
    business: {
      businessName: "JDC Construction Services",
    },
  },
  {
    id: "client-003",
    firstName: "Angela",
    lastName: "Reyes",
    email: "angela.reyes@example.com",
    business: {
      businessName: "Reyes Online Shop",
    },
  },
  {
    id: "client-004",
    firstName: "Carlo",
    lastName: "Garcia",
    email: "carlo.garcia@example.com",
    business: {
      businessName: "Garcia Food Services",
    },
  },
]

export const mockEngagements = [
  {
    id: "MOCK-ENG-001",
    engagementNumber: "DEMO-ENG-001",
    serviceName: "Annual Tax Filing",
    client: {
      id: "client-001",
      firstName: "Maria",
      lastName: "Santos",
    },
    business: {
      businessName: "Santos Retail Trading",
    },
  },
  {
    id: "MOCK-ENG-002",
    engagementNumber: "DEMO-ENG-002",
    serviceName: "Quarterly VAT Filing",
    client: {
      id: "client-002",
      firstName: "Juan",
      lastName: "Dela Cruz",
    },
    business: {
      businessName: "JDC Construction Services",
    },
  },
  {
    id: "MOCK-ENG-003",
    engagementNumber: "DEMO-ENG-003",
    serviceName: "Business Registration",
    client: {
      id: "client-003",
      firstName: "Angela",
      lastName: "Reyes",
    },
    business: {
      businessName: "Reyes Online Shop",
    },
  },
]

let mockBillings = [
  // Pending payment — no payment submitted yet
  {
    id: "BILL-MOCK-0001",
    engagement_id: "MOCK-ENG-001",
    client_id: null,
    billing_month: null,
    billing_year: null,
    invoice_type: "service_fee",
    amount: 2500,
    status: "unpaid",
    payment_method: null,
    payment_proof_url: "",
    payment_reference: "",
    due_date: "2026-11-15",
  },

  // For verification — client paid through GCash and uploaded proof
  {
    id: "BILL-MOCK-0002",
    engagement_id: null,
    client_id: "client-002",
    billing_month: 11,
    billing_year: 2026,
    invoice_type: "retainer_fee",
    amount: 5000,
    status: "for_verification",
    payment_method: "gcash",
    payment_proof_url: "/mock/payment-proof-0001.png",
    payment_reference: "",
    due_date: "2026-11-08",
  },

  // Paid — verified bank payment
  {
    id: "BILL-MOCK-0003",
    engagement_id: "MOCK-ENG-003",
    client_id: null,
    billing_month: null,
    billing_year: null,
    invoice_type: "service_fee",
    amount: 8750.5,
    status: "paid",
    payment_method: "bank",
    payment_proof_url: "/mock/payment-proof-0002.png",
    payment_reference: "DEMO-BANK-0003",
    due_date: "2026-10-20",
  },

  // Paid — cash payment received at the office
  {
    id: "BILL-MOCK-0004",
    engagement_id: "MOCK-ENG-002",
    client_id: null,
    billing_month: null,
    billing_year: null,
    invoice_type: "service_fee",
    amount: 3500,
    status: "paid",
    payment_method: "cash",
    payment_proof_url: "",
    payment_reference: "",
    due_date: "2026-10-25",
  },
]

let nextBillingNumber = 5

export function getMockBillings() {
  return mockBillings
}

export function createMockBilling({
  engagement_id = null,
  client_id = null,
  billing_month = null,
  billing_year = null,
  invoice_type,
  amount,
  due_date,
  payment_method = null,
  payment_reference = "",
  payment_proof_url = "",
}) {
  const record = {
    id: `BILL-MOCK-${String(nextBillingNumber).padStart(4, "0")}`,

    engagement_id,
    client_id,

    billing_month,
    billing_year,

    invoice_type,
    amount,

    status: "unpaid",
    payment_method,
    payment_proof_url,
    payment_reference,

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
    if (billing.id !== id || billing.status === status) {
      return billing
    }

    updated = true

    return {
      ...billing,
      status,
    }
  })

  return updated
}

export function verifyMockPayment(id, paymentMethod, referenceId = "") {
  const billing = mockBillings.find((record) => record.id === id)
  const trimmedReferenceId = referenceId.trim()

  if (!billing || !paymentMethod) {
    return false
  }

  // Only cash payments can be verified directly
  // when the billing is still pending payment.
  if (billing.status === "unpaid" && paymentMethod !== "cash") {
    return false
  }

  if (!["unpaid", "for_verification"].includes(billing.status)) {
    return false
  }

  // Cash does not require proof or reference ID.
  if (paymentMethod === "cash") {
    mockBillings = mockBillings.map((record) => {
      if (record.id !== id) return record

      return {
        ...record,
        payment_method: "cash",
        payment_proof_url: "",
        payment_reference: "",
        status: "paid",
      }
    })

    return true
  }

  // Electronic payments require BOTH:
  // 1. Payment proof URL
  // 2. Reference ID
  if (!billing.payment_proof_url || !trimmedReferenceId) {
    return false
  }

  mockBillings = mockBillings.map((record) => {
    if (record.id !== id) return record

    return {
      ...record,
      payment_method: paymentMethod,
      payment_reference: trimmedReferenceId,
      status: "paid",
    }
  })

  return true
}

export function rejectMockPayment(id) {
  let updated = false

  mockBillings = mockBillings.map((billing) => {
    if (
      billing.id !== id ||
      billing.status !== "for_verification"
    ) {
      return billing
    }

    updated = true

    return {
      ...billing,
      status: "unpaid",
      payment_reference: "",
    }
  })

  return updated
}
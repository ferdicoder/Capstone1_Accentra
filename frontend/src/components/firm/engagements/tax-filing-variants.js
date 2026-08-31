export const taxFilingStages = [
  { key: "required_documents", label: "Required Documents" },
  { key: "compute_tax", label: "Compute Tax" },
  { key: "client_approval", label: "Client Approval" },
  { key: "file_tax", label: "File Tax" },
  { key: "completed", label: "Completed" },
]

export const taxFilingRequiredDocs = {
  "Tax Filing - Non VAT": [
    { id: "monthly_gross_sales", name: "Monthly Gross Sales Summary" },
    { id: "sales_record", name: "Sales Record" },
  ],
  "Tax Filing - VAT": [
    { id: "sales_summary", name: "Sales Summary" },
    { id: "purchase_summary", name: "Purchase Summary" },
    { id: "vat_input_summary", name: "VAT Input Summary" },
    { id: "vat_output_summary", name: "VAT Output Summary" },
    { id: "bir_invoices", name: "BIR Invoices" },
    { id: "bir_receipts", name: "BIR Receipts" },
  ],
}

export const taxFilingOutputs = [
  "Tax Computation Summary",
  "BIR Tax Return Document",
  "Filing Confirmation",
  "Proof of Payment",
]

export const computationStatusStyles = {
  pending: "bg-gray-50 text-gray-500",
  in_progress: "bg-blue-50 text-blue-700",
  ready_for_approval: "bg-emerald-50 text-emerald-700",
}

export const computationStatusLabels = {
  pending: "Pending",
  in_progress: "In Progress",
  ready_for_approval: "Ready For Approval",
}

export const approvalStatusStyles = {
  waiting_approval: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
}

export const approvalStatusLabels = {
  waiting_approval: "Waiting Approval",
  approved: "Approved",
  rejected: "Rejected",
}

export const filingStatusStyles = {
  pending_filing: "bg-gray-50 text-gray-500",
  filed: "bg-emerald-50 text-emerald-700",
}

export const filingStatusLabels = {
  pending_filing: "Pending Filing",
  filed: "Filed",
}

export const getRequiredDocsForService = (serviceName) => {
  return taxFilingRequiredDocs[serviceName] ?? null
}

export const isTaxFilingService = (serviceName) => {
  return serviceName === "Tax Filing - Non VAT" || serviceName === "Tax Filing - VAT"
}

export const isVatService = (serviceName) => {
  return serviceName === "Tax Filing - VAT"
}

// Non-VAT tax treatment options (Section 116, 8% option, graduated rates)
export const nonVatTaxTreatments = [
  { value: "3_percent", label: "3% Percentage Tax – Section 116" },
  { value: "8_percent", label: "8% Income Tax Option" },
  { value: "graduated", label: "Graduated Income Tax Rates" },
]

// VAT filing period options (BIR Form 2550Q quarterly, 2550M monthly optional)
export const vatFilingPeriods = [
  { value: "quarterly", label: "Quarterly – BIR Form 2550Q" },
  { value: "monthly", label: "Monthly – BIR Form 2550M (optional)" },
]

// Withholding Tax ATC codes (common categories for capstone)
export const withholdingTaxClassifications = [
  { value: "professional_fees", label: "Professional / Consultancy Fees", rate: 10 },
  { value: "commissions", label: "Commissions", rate: 10 },
  { value: "rental", label: "Rental of Real Property", rate: 5 },
  { value: "suppliers", label: "Suppliers of Goods", rate: 1 },
  { value: "contractors", label: "Contractors / Sub-contractors", rate: 2 },
  { value: "government", label: "Government", rate: 1 },
  { value: "others", label: "Others", rate: 0 },
]

export const getWithholdingRate = (classification) => {
  const found = withholdingTaxClassifications.find(c => c.value === classification)
  return found ? found.rate : 0
}

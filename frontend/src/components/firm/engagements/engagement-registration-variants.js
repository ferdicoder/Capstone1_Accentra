export const registrationMilestoneTemplates = {
  "Sole Proprietorship": [
    { id: "consultation", label: "Consultation Meeting" },
    { id: "dti", label: "DTI Registration" },
    { id: "barangay", label: "Barangay Clearance" },
    { id: "mayors_permit", label: "Mayor's Permit" },
    { id: "bir", label: "BIR Registration" },
    { id: "sss", label: "SSS Registration" },
    { id: "philhealth", label: "PhilHealth Registration" },
    { id: "pagibig", label: "Pag-IBIG Registration" },
  ],
  "Corporation": [
    { id: "consultation", label: "Consultation Meeting" },
    { id: "sec", label: "SEC Registration" },
    { id: "barangay", label: "Barangay Clearance" },
    { id: "mayors_permit", label: "Mayor's Permit" },
    { id: "bir", label: "BIR Registration" },
    { id: "sss", label: "SSS Registration" },
    { id: "philhealth", label: "PhilHealth Registration" },
    { id: "pagibig", label: "Pag-IBIG Registration" },
  ],
  "Partnership": [
    { id: "consultation", label: "Consultation Meeting" },
    { id: "sec", label: "SEC Registration" },
    { id: "barangay", label: "Barangay Clearance" },
    { id: "mayors_permit", label: "Mayor's Permit" },
    { id: "bir", label: "BIR Registration" },
    { id: "sss", label: "SSS Registration" },
    { id: "philhealth", label: "PhilHealth Registration" },
    { id: "pagibig", label: "Pag-IBIG Registration" },
  ],
}

export const milestoneStatusOptions = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

export const milestoneStatusStyles = {
  pending: {
    badge: "bg-gray-50 text-gray-500",
    icon: "text-gray-400",
  },
  in_progress: {
    badge: "bg-blue-50 text-blue-700",
    icon: "text-blue-600",
  },
  completed: {
    badge: "bg-emerald-50 text-emerald-700",
    icon: "text-emerald-600",
  },
}

export const supportedBusinessTypes = [
  "Sole Proprietorship",
  "Corporation",
  "Partnership",
]

export const getMilestoneTemplate = (businessType) => {
  return registrationMilestoneTemplates[businessType] ?? null
}

export const isRegistrationSupported = (businessType) => {
  return supportedBusinessTypes.includes(businessType)
}

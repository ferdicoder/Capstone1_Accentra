export const workflowStages = [
  { key: "document_collection", label: "Document Collection", order: 0 },
  { key: "for_validation", label: "For Validation", order: 1 },
  { key: "in_progress", label: "In Progress", order: 2 },
]

export const engagementStatusOptions = [
  ...workflowStages,
  { key: "completed", label: "Completed", order: 3 },
  { key: "cancelled", label: "Cancel Engagement", order: 4 },
]

export const getWorkflowStageIndex = (status) => workflowStages.findIndex((s) => s.key === status)

export const isEngagementActive = (status) => status !== "completed" && status !== "cancelled"
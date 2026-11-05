const activityLabels = {
  document_uploaded: "uploaded a document",
  stage_change: "updated the engagement status",
  task_completed: "completed a task",
  staff_reassigned: "changed the assigned staff",
  schedule_updated: "updated the engagement schedule",
  // Added for the Admin dashboard. Only used if the backend logs these types.
  billing_created: "created a billing record",
  payment_verified: "verified a payment",
  lead_reassigned: "reassigned an engagement lead",
  client_converted: "converted a client to Retainer",
}

export function describeActivity(entry) {
  const actor = entry.actorName ?? "Unknown user"
  const action = activityLabels[entry.type] ?? "performed an action"

  return {
    title: `${actor} ${action}`,
    description: entry.message,
  }
}

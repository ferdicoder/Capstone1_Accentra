const activityLabels = {
  document_uploaded: "uploaded a document",
  stage_change: "updated the engagement status",
  task_added: "added a task",
  task_updated: "updated a task",
  task_approved: "approved a task",
  task_revision_requested: "requested a revision on a task",
  task_completed: "completed a task",
  staff_reassigned: "changed the assigned staff",
  schedule_updated: "updated the engagement schedule",
  // Added for the Admin dashboard. Only used if the backend logs these types.
  billing_created: "created a billing record",
  payment_verified: "verified a payment",
  lead_reassigned: "reassigned an engagement lead",
  client_converted: "converted a client to Retainer",
  // audit_logs actions written by backend/sql/audit_logs_triggers.sql.
  user_created: "created a staff account",
  user_role_changed: "changed a user role",
  password_changed: "changed a password",
  client_retainer_changed: "updated retainer details",
  report_exported: "downloaded a report",
}

export function describeActivity(entry) {
  const actor = entry.actorName ?? "Unknown user"
  const action = activityLabels[entry.type] ?? "performed an action"

  return {
    title: `${actor} ${action}`,
    description: entry.message,
  }
}
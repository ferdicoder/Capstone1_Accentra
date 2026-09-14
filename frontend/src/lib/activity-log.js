const activityLabels = {
  document_uploaded: "uploaded a document",
  stage_change: "updated the engagement status",
  task_completed: "completed a task",
}

export function describeActivity(entry) {
  const actor = entry.actorName ?? "Unknown user"
  const action = activityLabels[entry.type] ?? "performed an action"

  return {
    title: `${actor} ${action}`,
    description: entry.message,
  }
}
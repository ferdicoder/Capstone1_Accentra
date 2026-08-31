import { CheckCircle2, Circle, Pencil } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { milestoneStatusStyles } from "./engagement-registration-variants"
import { formatDate } from "./engagement-variants"

function StatusIcon({ status }) {
  const styles = milestoneStatusStyles[status] ?? milestoneStatusStyles.pending

  if (status === "completed") {
    return <CheckCircle2 className={cn("size-5", styles.icon)} />
  }
  if (status === "in_progress") {
    return (
      <div className="flex size-5 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
        <Circle className="size-2.5 text-blue-600" />
      </div>
    )
  }
  return (
    <div className="flex size-5 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-100">
      <Circle className="size-2.5 text-gray-400" />
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = milestoneStatusStyles[status] ?? milestoneStatusStyles.pending
  const labels = { pending: "Pending", in_progress: "In Progress", completed: "Completed" }

  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", styles.badge)}>
      {labels[status] ?? "Pending"}
    </span>
  )
}

export function RegistrationMilestoneItem({ milestone, onUpdate }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-background px-4 py-3 transition-colors hover:bg-muted/50">
      <StatusIcon status={milestone.status} />

      <div className="flex flex-1 flex-col gap-0.5">
        <p className="text-sm font-medium text-foreground">{milestone.label}</p>
        <StatusBadge status={milestone.status} />
      </div>

      <div className="flex items-center gap-3">
        {milestone.completedDate ? (
          <span className="text-xs text-muted-foreground">{formatDate(milestone.completedDate)}</span>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          onClick={() => onUpdate?.(milestone)}
        >
          <Pencil className="size-3.5" />
          Update
        </Button>
      </div>
    </div>
  )
}

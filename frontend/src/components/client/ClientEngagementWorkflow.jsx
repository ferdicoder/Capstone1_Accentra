import { CheckCircle2, Circle } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  workflowStages,
  getWorkflowStageIndex,
  isWorkflowComplete,
  isWorkflowCancelled,
} from "@/components/firm/engagements/engagement-variants"

export function WorkflowProgress({ workflowStage, className }) {
  const isComplete = isWorkflowComplete(workflowStage)
  const isCancelled = isWorkflowCancelled(workflowStage)
  const progressIndex = getWorkflowStageIndex(workflowStage)
  const totalStages = workflowStages.length

  const progressPercent = isComplete
    ? 100
    : isCancelled
      ? 0
      : Math.round((progressIndex / (totalStages - 1)) * 100)

  const activeStepIndex = isComplete ? totalStages - 1 : progressIndex

  // Build grid template: auto 1fr auto 1fr ... auto
  // Circle columns = auto, line columns = 1fr (equal width)
  const gridCols = workflowStages
    .flatMap((_, i) => (i < totalStages - 1 ? ["auto", "1fr"] : ["auto"]))
    .join(" ")

  return (
    <div className={cn("rounded-xl border bg-background px-4 py-4 sm:px-5", className)}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Workflow Progress</h2>
        <span className="text-sm font-medium text-emerald-700">
          {isCancelled ? "Cancelled" : isComplete ? "Completed" : `${progressPercent}% complete`}
        </span>
      </div>

      {/* Scrolls horizontally on narrow screens instead of squishing the
          connecting lines / overlapping labels. */}
      <div className="-mx-1 overflow-x-auto px-1">
        <div
          className="grid min-w-[480px] items-start sm:min-w-0"
          style={{ gridTemplateColumns: gridCols }}
        >
          {workflowStages.map((stage, i) => {
            const isDone = i <= activeStepIndex
            const isLast = i === totalStages - 1
            return (
              <div key={stage.key} className="contents">
                {/* Circle + Label */}
                <div className="flex flex-col items-center gap-1.5 px-1.5 sm:px-2">
                  {isDone ? (
                    <CheckCircle2 className="size-5 text-emerald-600 sm:size-6" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/40 sm:size-6" />
                  )}
                  <span
                    className={`whitespace-nowrap text-[11px] text-center sm:text-xs ${
                      isDone ? "font-medium text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>

                {/* Connecting line */}
                {!isLast && (
                  <div className="flex items-center self-start pt-[9px] px-0 sm:pt-[11px]">
                    <div
                      className={cn(
                        "h-0.5 w-full",
                        i < activeStepIndex ? "bg-emerald-400" : "bg-muted-foreground/20"
                      )}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
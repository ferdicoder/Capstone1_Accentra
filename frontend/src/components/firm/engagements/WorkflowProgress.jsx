import { CheckCircle2, Circle } from "lucide-react"

import { cn } from "@/lib/utils"
import { workflowStages, getWorkflowStageIndex, isWorkflowComplete, isWorkflowCancelled } from "./engagement-variants"

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
    <div className={cn("rounded-xl border bg-background p-5", className)}>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Workflow Progress</h2>
        <span className="text-sm font-medium text-emerald-700">
          {isCancelled ? "Cancelled" : isComplete ? "Completed" : `${progressPercent}% complete`}
        </span>
      </div>

      <div className="grid items-start" style={{ gridTemplateColumns: gridCols }}>
        {workflowStages.map((stage, i) => {
          const isDone = i <= activeStepIndex
          const isLast = i === totalStages - 1
          return (
            <div key={stage.key} className="contents">
              {/* Circle + Label */}
              <div className="flex flex-col items-center gap-2 px-2">
                {isDone ? (
                  <CheckCircle2 className="size-7 text-emerald-600" />
                ) : (
                  <Circle className="size-7 text-muted-foreground/40" />
                )}
                <span
                  className={`whitespace-nowrap text-xs text-center ${
                    isDone ? "font-medium text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div className="flex items-center self-start pt-[14px] px-0">
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
  )
}

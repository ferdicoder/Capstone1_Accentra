import { useState } from "react"
import { Check, MoreHorizontal, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { engagementStatusOptions } from "@/lib/workflow-stages"
import { getEngagementDisplayStatus } from "./engagement-variants"

export function EngagementStatusDropdown({
  engagement,
  onStatusChange,
  onCancel,
  onViewDetails,
  compact = false,
}) {
  const [pendingStatus, setPendingStatus] = useState(null)
  if (!engagement) return null

  const currentStatus = getEngagementDisplayStatus(engagement.status)
  const progressionStatuses = engagementStatusOptions.filter(
    (option) => option.key !== "cancelled"
  )
  const currentStageIndex = progressionStatuses.findIndex(
    (option) => option.key === currentStatus
  )
  const nextStatus = currentStageIndex >= 0
    ? progressionStatuses[currentStageIndex + 1]?.key
    : undefined
  const pendingOption = progressionStatuses.find(
    (option) => option.key === pendingStatus
  )

  const isStatusDisabled = (status) => status !== nextStatus

  const selectStatus = (status) => {
    if (status === "cancelled") {
      onCancel?.(engagement)
    } else if (status === nextStatus) {
      setPendingStatus(status)
    }
  }

  const confirmStatusChange = () => {
    if (pendingStatus === nextStatus) {
      onStatusChange?.(engagement, pendingStatus)
    }
    setPendingStatus(null)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            compact ? (
              <button
                type="button"
                aria-label={`Change status for ${engagement.engagementNumber}`}
                className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              />
            ) : (
              <Button
                variant="outline"
                size="default"
                className="h-9 gap-1.5 rounded-lg px-3 text-sm"
              />
            )
          }
        >
          {compact ? <MoreHorizontal className="size-4" /> : <>Change Status <span className="size-3.5 opacity-60">▾</span></>}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          {onViewDetails && (
            <>
              <DropdownMenuItem onClick={() => onViewDetails(engagement)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {progressionStatuses.map((option) => (
            <DropdownMenuItem
              key={option.key}
              onClick={() => selectStatus(option.key)}
              disabled={isStatusDisabled(option.key)}
              className={
                currentStatus === option.key
                  ? "bg-emerald-100 font-medium text-emerald-900 data-disabled:opacity-100"
                  : isStatusDisabled(option.key)
                    ? "text-muted-foreground"
                    : "text-foreground"
              }
            >
              {currentStatus === option.key && <Check className="size-4" />}
              {option.label}
            </DropdownMenuItem>
          ))}
          {onCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => selectStatus("cancelled")}
                variant="destructive"
              >
                <XCircle className="size-4" />
                Cancel Engagement
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog
        open={Boolean(pendingStatus)}
        onOpenChange={(open) => !open && setPendingStatus(null)}
      >
        <DialogContent className="max-w-md p-5 sm:p-6">
          <DialogHeader className="gap-2">
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription className="text-sm leading-6 text-muted-foreground">
              Move this engagement from {progressionStatuses[currentStageIndex]?.label} to{" "}
              {pendingOption?.label}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-1 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingStatus(null)}
            >
              Keep Current Status
            </Button>
            <Button
              type="button"
              className="bg-[#02353C] text-white hover:opacity-90"
              onClick={confirmStatusChange}
            >
              Confirm Change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

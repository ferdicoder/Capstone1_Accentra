import { Ban, CheckCircle2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Presentational approve/reject buttons for a service request. Only updates local state. */
export function RequestActionButtons({
  status = "pending",
  processing = null,
  onApprove,
  onReject,
  className,
  ...props
}) {
  const isDecided = status === "approved" || status === "rejected"
  const isProcessing = processing === "approve" || processing === "reject"

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
      <Button
        type="button"
        variant="destructive"
        onClick={onReject}
        disabled={isDecided || isProcessing}
        title="Reject Request"
        className="h-9 gap-1.5"
      >
        {processing === "reject" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Ban className="size-4" />
        )}
        {processing === "reject" ? "Rejecting..." : "Reject"}
      </Button>

      <Button
        type="button"
        onClick={onApprove}
        disabled={isDecided || isProcessing}
        title="Approve & Create Engagement"
        className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
      >
        {processing === "approve" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <CheckCircle2 className="size-4" />
        )}
        {processing === "approve" ? "Approving..." : "Approve"}
      </Button>
    </div>
  )
}

/** Presentational approved/rejected notice strip. Renders null while pending. */
export function RequestActionNotice({ status }) {
  if (status === "approved") {
    return (
      <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
        This request has been approved and an engagement has been created.
      </div>
    )
  }
  if (status === "rejected") {
    return (
      <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 ring-1 ring-red-500/20 ring-inset">
        This request has been rejected.
      </div>
    )
  }
  return null
}

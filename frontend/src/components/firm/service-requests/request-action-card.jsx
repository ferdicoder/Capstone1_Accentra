import { Ban, CheckCircle2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/** Presentational card with the approve/reject actions for a service request. Only updates local state. */
export function RequestActionCard({
  status = "pending",
  processing = null,
  onApprove,
  onReject,
  className,
  ...props
}) {
  const isApproved = status === "approved"
  const isRejected = status === "rejected"
  const isDecided = isApproved || isRejected
  const isProcessing = processing === "approve" || processing === "reject"

  return (
    <div
      data-slot="request-action-card"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <h2 className="mb-1 text-sm font-semibold">Take Action</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Decide whether to accept this request and start an engagement.
      </p>

      {isApproved && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
          This request has been approved and an engagement has been created.
        </div>
      )}
      {isRejected && (
        <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 ring-1 ring-red-500/20 ring-inset">
          This request has been rejected.
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <Button
          type="button"
          onClick={onApprove}
          disabled={isDecided || isProcessing}
          className="w-full gap-2 bg-[#02353c] text-white hover:opacity-90"
        >
          {processing === "approve" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <CheckCircle2 className="size-4" />
          )}
          {processing === "approve" ? "Approving..." : "Approve & Create Engagement"}
        </Button>

        <Button
          type="button"
          variant="destructive"
          onClick={onReject}
          disabled={isDecided || isProcessing}
          className="w-full gap-2"
        >
          {processing === "reject" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Ban className="size-4" />
          )}
          {processing === "reject" ? "Rejecting..." : "Reject Request"}
        </Button>
      </div>
    </div>
  )
}

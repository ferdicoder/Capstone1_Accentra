import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ClientInfoCard } from "./client-info-card"
import { RequestActionButtons, RequestActionNotice } from "./request-action-buttons"
import { RequestDetailsCard } from "./request-details-card"
import { ServiceRequestAvatar } from "./service-request-avatar"
import { formatSubmittedDate } from "./service-request-variants"

/**
 * Modal that shows a single service request for review. The parent owns
 * `open`/`onOpenChange` and the data work (`onApprove`/`onReject`); the dialog
 * owns its transient UI state (internal notes + simulated processing), which
 * resets on every open.
 *
 * When the user clicks "Approve & Create Engagement", the dialog calls
 * `onApproveAndEngage` instead of `onApprove` so the parent can close this
 * modal and open the Create Engagement modal on top.
 */
export function RequestDetailDialog({
  open = false,
  onOpenChange,
  request,
  onApprove,
  onReject,
  onApproveAndEngage,
  canReject = false,
  rejecting = false,
  rejectionError = "",
}) {
  const [processing, setProcessing] = useState(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectStep, setRejectStep] = useState("confirm")
  const [remarks, setRemarks] = useState("")
  const [remarksError, setRemarksError] = useState("")

  const handleAction = (action) => {
    setProcessing(action)
    // Simulated request — swap for a real API call later.
    window.setTimeout(() => {
      if (action === "approve") {
        // If an engagement callback is provided, prefer it (modal-to-modal flow).
        if (onApproveAndEngage) {
          onApproveAndEngage(request)
        } else {
          onApprove?.(request)
        }
      }
      setProcessing(null)
    }, 600)
  }

  const closeRejectDialog = () => {
    if (rejecting) return
    setRejectDialogOpen(false)
    setRejectStep("confirm")
    setRemarks("")
    setRemarksError("")
  }

  const handleSubmitRejection = (event) => {
    event.preventDefault()
    const reason = remarks.trim()
    if (!reason) {
      setRemarksError("Please enter a reason for rejecting this request.")
      return
    }
    onReject?.(request, reason, () => {
      setRejectDialogOpen(false)
      setRejectStep("confirm")
      setRemarks("")
      setRemarksError("")
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-slot="request-detail-dialog" className="max-w-3xl">
          <DialogHeader className="flex-col items-start gap-3 border-b pb-4 pr-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <ServiceRequestAvatar name={request?.business?.businessName} className="shrink-0" />
              <div className="min-w-0">
              <DialogTitle className="truncate text-lg">{request?.business?.businessName}</DialogTitle>
              <DialogDescription className="truncate">
                {request?.requestNumber} · {request?.serviceName} · submitted{" "}
                {formatSubmittedDate(request?.submittedDate)}
              </DialogDescription>
              </div>
            </div>

            <RequestActionButtons
              status={request?.status}
              processing={rejecting ? "reject" : processing}
              canReject={canReject}
              onApprove={() => handleAction("approve")}
              onReject={() => setRejectDialogOpen(true)}
              className="shrink-0"
            />
          </DialogHeader>

          <RequestActionNotice status={request?.status} />

          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-5">
              <RequestDetailsCard request={request} />
              <ClientInfoCard request={request} />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rejectDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) closeRejectDialog()
        }}
      >
        <DialogContent className="sm:max-w-lg">
          {rejectStep === "confirm" ? (
            <>
              <DialogHeader>
              <DialogTitle>Reject this service request?</DialogTitle>
              <DialogDescription>
                Confirm to continue to the remarks form.
              </DialogDescription>
              </DialogHeader>
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
              <p className="font-medium">{request?.requestNumber}</p>
              <p className="text-muted-foreground">
                {request?.business?.businessName} · {request?.serviceName}
              </p>
              </div>
              <DialogFooter>
              <Button type="button" variant="outline" onClick={closeRejectDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => setRejectStep("remarks")}
              >
                Continue
              </Button>
              </DialogFooter>
            </>
          ) : (
            <form onSubmit={handleSubmitRejection} className="flex min-h-0 flex-col gap-4">
              <DialogHeader>
              <DialogTitle>Reason for rejection</DialogTitle>
              <DialogDescription>
                Enter the reason to share with the client. Remarks are required.
              </DialogDescription>
              </DialogHeader>
              <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="rejection-remarks">
              Remarks
              <Textarea
                id="rejection-remarks"
                value={remarks}
                onChange={(event) => {
                  setRemarks(event.target.value)
                  if (remarksError) setRemarksError("")
                }}
                placeholder="Explain why this service request cannot be accepted..."
                rows={5}
                maxLength={1000}
                aria-invalid={Boolean(remarksError)}
                aria-describedby={remarksError ? "rejection-remarks-error" : undefined}
                disabled={rejecting}
              />
              </label>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
              {remarksError ? (
                <p id="rejection-remarks-error" className="text-destructive" role="alert">
                  {remarksError}
                </p>
              ) : (
                <span>Client-facing remarks</span>
              )}
              <span>{remarks.length}/1000</span>
              </div>
              {rejectionError && (
              <p className="text-sm text-destructive" role="alert">{rejectionError}</p>
              )}
              <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRejectStep("confirm")
                  setRemarksError("")
                }}
                disabled={rejecting}
              >
                Back
              </Button>
              <Button type="submit" variant="destructive" disabled={rejecting}>
                {rejecting ? "Rejecting..." : "Confirm rejection"}
              </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

import { useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const REJECTION_REMARKS_MAX_LENGTH = 1000

/**
 * Confirmation dialog before rejecting a submitted payment reference.
 * Mirrors the CancelBillingDialog pattern and the service-request rejection
 * flow: first confirm, then require a remarks entry before rejecting.
 * Reject changes the single billing status back to the existing
 * unresolved/pending state (spec section 9: never a persistent
 * "payment_status = verified").
 */
export function RejectPaymentDialog({ billing, open, onOpenChange, onConfirm, submitting = false }) {
  const [step, setStep] = useState("confirm")
  const [remarks, setRemarks] = useState("")
  const [remarksError, setRemarksError] = useState("")

  const closeDialog = () => {
    if (submitting) return
    setStep("confirm")
    setRemarks("")
    setRemarksError("")
    onOpenChange?.(false)
  }

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen) closeDialog()
  }

  const handleSubmitRemarks = (event) => {
    event.preventDefault()
    const reason = remarks.trim()
    if (!reason) {
      setRemarksError("Please enter a reason for rejecting this payment.")
      return
    }
    onConfirm?.(reason)
  }

  const handleBack = () => {
    if (submitting) return
    setStep("confirm")
    setRemarksError("")
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent data-slot="reject-payment-dialog">
        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle>Reject this payment?</DialogTitle>
              <DialogDescription>
                Confirm to continue to the remarks form.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
              <p className="text-xs font-medium text-muted-foreground">Payment Reference</p>
              <p className="mt-0.5 font-medium break-all text-foreground">
                {billing?.payment_reference ?? "—"}
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" disabled={submitting} onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={submitting}
                onClick={() => setStep("remarks")}
              >
                Continue
              </Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={handleSubmitRemarks} className="flex min-h-0 flex-col gap-4">
            <DialogHeader>
              <DialogTitle>Reason for rejection</DialogTitle>
              <DialogDescription>
                Enter the reason to share with the client. Remarks are required.
              </DialogDescription>
            </DialogHeader>

            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="payment-rejection-remarks">
              Remarks
              <Textarea
                id="payment-rejection-remarks"
                value={remarks}
                onChange={(event) => {
                  setRemarks(event.target.value)
                  if (remarksError) setRemarksError("")
                }}
                placeholder="Explain why this payment cannot be accepted..."
                rows={5}
                maxLength={REJECTION_REMARKS_MAX_LENGTH}
                aria-invalid={Boolean(remarksError)}
                aria-describedby={remarksError ? "payment-rejection-remarks-error" : undefined}
                disabled={submitting}
              />
            </label>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              {remarksError ? (
                <p id="payment-rejection-remarks-error" className="text-destructive" role="alert">
                  {remarksError}
                </p>
              ) : (
                <span>Client-facing remarks</span>
              )}
              <span>
                {remarks.length}/{REJECTION_REMARKS_MAX_LENGTH}
              </span>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleBack} disabled={submitting}>
                Back
              </Button>
              <Button type="submit" variant="destructive" disabled={submitting}>
                {submitting ? "Rejecting..." : "Confirm rejection"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function VerifyPaymentDialog({
  billing,
  open,
  onOpenChange,
  onConfirm,
  submitting = false,
}) {
  const [paymentMethod, setPaymentMethod] = useState(
    billing?.payment_method ?? ""
  )

  const [referenceId, setReferenceId] = useState(
    billing?.payment_reference ?? ""
  )

  useEffect(() => {
    if (open) {
      setPaymentMethod(billing?.payment_method ?? "")
      setReferenceId(billing?.payment_reference ?? "")
    }
  }, [open, billing])

  const isCash = paymentMethod === "cash"
  const hasPaymentProof = Boolean(billing?.payment_proof_url)
  const trimmedReferenceId = referenceId.trim()

  const canConfirm =
  Boolean(paymentMethod) &&
  (
    isCash ||
    (hasPaymentProof && trimmedReferenceId.length > 0)
  ) &&
  !submitting

  {isCash ? (
      <p className="text-xs text-muted-foreground">
        Cash payments do not require payment proof or a reference ID.
      </p>
    ) : (
      <p className="text-xs text-muted-foreground">
        Payment proof and a reference ID are required before this payment
        can be verified.
      </p>
    )}

    {!isCash && (
  <div className="flex flex-col gap-2">
    <label
      htmlFor="payment-reference-id"
      className="text-sm font-medium text-foreground"
    >
      Reference ID
    </label>

    <Input
      id="payment-reference-id"
      value={referenceId}
      onChange={(event) => setReferenceId(event.target.value)}
      placeholder="Enter reference ID from payment proof"
      disabled={submitting}
      autoComplete="off"
    />

    <p className="text-xs text-muted-foreground">
      Required for GCash, Bank, and Maya payments.
    </p>
  </div>
)}

  const handleConfirm = () => {
    if (!canConfirm) return

    onConfirm?.(paymentMethod, trimmedReferenceId)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="verify-payment-dialog">
        <DialogHeader>
          <DialogTitle>Verify Payment</DialogTitle>

          <DialogDescription>
            Confirm the payment method and review the submitted payment
            information before marking this billing as Paid.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="payment-method"
              className="text-sm font-medium text-foreground"
            >
              Payment Method
            </label>

            <select
              id="payment-method"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
              disabled={submitting}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                Select payment method
              </option>
              <option value="gcash">GCash</option>
              <option value="bank">Bank</option>
              <option value="maya">Maya</option>
              <option value="cash">Cash</option>
            </select>
          </div>

       <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Payment Proof
          </p>

          {isCash ? (
            <p className="mt-1 text-muted-foreground">
              Not required for cash payment.
            </p>
          ) : billing?.payment_proof_url ? (
            <a
              href={billing.payment_proof_url}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-block font-medium text-forest-900 hover:underline"
            >
              View Uploaded Proof
            </a>
          ) : (
            <p className="mt-1 text-destructive">
              Payment proof is required.
            </p>
          )}
        </div>

          {/* Reference ID */}
          {!isCash && (
            <div className="flex flex-col gap-2">
              <label
                htmlFor="payment-reference-id"
                className="text-sm font-medium text-foreground"
              >
                Reference ID
              </label>

              <Input
                id="payment-reference-id"
                value={referenceId}
                onChange={(event) => setReferenceId(event.target.value)}
                placeholder="Enter reference ID from payment proof"
                disabled={submitting}
                autoComplete="off"
              />

              <p className="text-xs text-muted-foreground">
                Enter the reference ID exactly as shown in the uploaded
                payment proof.
              </p>
            </div>
          )}

          {/* Cash Notice */}
          {isCash && (
            <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
              <p className="text-xs font-medium text-muted-foreground">
                Cash Payment
              </p>
              <p className="mt-1 text-muted-foreground">
                No payment proof or reference ID is required for cash
                payments received at the firm.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="cursor-pointer bg-forest-900 text-white hover:opacity-90"
          >
            {submitting && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Confirm Verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
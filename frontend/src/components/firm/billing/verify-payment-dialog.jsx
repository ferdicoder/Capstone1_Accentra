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
  onReject,
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
  const isValidReferenceId = /^\d{4}$/.test(trimmedReferenceId)

  /*
   * Cash:
   * - No payment proof required
   * - No reference ID required
   *
   * Electronic payment:
   * - Payment proof required
   * - Reference ID required
   */
  const canConfirm =
    Boolean(paymentMethod) &&
    (
      isCash ||
      (
        hasPaymentProof &&
        isValidReferenceId
      )
    ) &&
    !submitting

  const handleConfirm = () => {
    if (!canConfirm) return

    onConfirm?.(paymentMethod, trimmedReferenceId)
  }

  const handleReject = () => {
    if (submitting) return

    onReject?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="verify-payment-dialog">
        <DialogHeader>
          <DialogTitle>Verify Payment</DialogTitle>

          <DialogDescription>
            Confirm the payment method and review the payment information
            before marking this billing as Paid.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Payment Method */}
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
              onChange={(event) =>
                setPaymentMethod(event.target.value)
              }
              disabled={submitting}
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="" disabled>
                Select payment method
              </option>

              <option value="gcash">GCash</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="retainer">Retainer</option>
            </select>
          </div>

          {/* Payment Proof */}
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
                Last 4 digits of Reference ID
              </label>

            <Input
              id="payment-reference-id"
              value={referenceId}
              onChange={(event) => {
                const value = event.target.value.replace(/\D/g, "").slice(0, 4)
                setReferenceId(value)
              }}
              placeholder="Enter 4-digit reference ID"
              inputMode="numeric"
              maxLength={4}
              disabled={submitting}
              autoComplete="off"
            />

              <p className="text-xs text-muted-foreground">
                Required for GCash, Bank, and Maya payments.
              </p>
            </div>
          )}

          {/* Cash Notice */}
          {isCash && (
            <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
              <p className="font-medium text-foreground">
                Cash payment
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Cash payments do not require payment proof or a
                reference ID.
              </p>
            </div>
          )}

          {/* Electronic Payment Validation */}
          {!isCash && paymentMethod && (
            <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
              <p className="font-medium text-foreground">
                Verification Requirements
              </p>

              <ul className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground">
                <li>
                  {hasPaymentProof ? "✓" : "•"} Payment proof
                </li>

                <li>
                  {trimmedReferenceId ? "✓" : "•"} Reference ID
                </li>
              </ul>

            {!hasPaymentProof && (
              <p className="mt-2 text-xs text-destructive">
                Payment proof is required before this payment can be verified.
              </p>
            )}

            {hasPaymentProof && !trimmedReferenceId && (
              <p className="mt-2 text-xs text-destructive">
                Reference ID is required before this payment can be verified.
              </p>
            )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange?.(false)}
          >
            Cancel
          </Button>

          <div className="flex gap-2">
            {billing?.status === "for_verification" && (
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={handleReject}
                className="cursor-pointer text-destructive hover:text-destructive"
              >
                Reject Payment
              </Button>
            )}

            <Button
              type="button"
              disabled={!canConfirm}
              onClick={handleConfirm}
              className="cursor-pointer bg-forest-900 text-white hover:opacity-90"
            >
              {submitting && (
                <Loader2 className="size-4 animate-spin" />
              )}

              Confirm Payment
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

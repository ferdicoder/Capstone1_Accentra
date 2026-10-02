import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/**
 * Confirmation dialog before marking a payment as verified.
 *
 * @param {Object} billing - The billing record being verified.
 * @param {boolean} open
 * @param {Function} onOpenChange
 * @param {Function} onConfirm - () => void
 * @param {boolean} submitting
 */
export function VerifyPaymentDialog({ billing, open, onOpenChange, onConfirm, submitting = false }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="verify-payment-dialog">
        <DialogHeader>
          <DialogTitle>Verify Payment</DialogTitle>
          <DialogDescription>
            Are you sure you want to mark this payment as verified and update this
            billing record to Paid?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Payment Reference</p>
          <p className="mt-0.5 font-medium break-all text-foreground">
            {billing?.payment_reference ?? "—"}
          </p>
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
            disabled={submitting}
            onClick={onConfirm}
            className="cursor-pointer bg-forest-900 text-white hover:opacity-90"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Confirm Verification
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

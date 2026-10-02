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
 * Confirmation dialog before rejecting a submitted payment reference.
 * Mirrors the CancelBillingDialog pattern. Reject changes the single
 * billing status back to the existing unresolved/pending state
 * (spec section 9: never a persistent "payment_status = verified").
 */
export function RejectPaymentDialog({ billing, open, onOpenChange, onConfirm, submitting = false }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="reject-payment-dialog">
        <DialogHeader>
          <DialogTitle>Reject Payment</DialogTitle>
          <DialogDescription>
            Are you sure you want to reject this payment reference? The billing will
            return to Pending Payment.
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
            variant="destructive"
            disabled={submitting}
            onClick={onConfirm}
            className="cursor-pointer"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Reject Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

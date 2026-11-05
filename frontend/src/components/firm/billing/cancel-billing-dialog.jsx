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
 * Confirmation dialog before cancelling a billing record.
 */
export function CancelBillingDialog({ billing, open, onOpenChange, onConfirm, submitting = false }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="cancel-billing-dialog">
        <DialogHeader>
          <DialogTitle>Cancel Billing</DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel this billing record?
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-border bg-muted/40 p-3.5 text-sm">
          <p className="text-xs font-medium text-muted-foreground">Billing ID</p>
          <p className="mt-0.5 font-medium text-foreground">{billing?.id ?? "—"}</p>
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange?.(false)}
          >
            Keep Billing
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={submitting}
            onClick={onConfirm}
            className="cursor-pointer"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Cancel Billing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

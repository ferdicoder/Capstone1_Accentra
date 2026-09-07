import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

export function CancelEngagementDialog({ open = false, onOpenChange, onConfirm }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6">
        <DialogHeader className="gap-2">
          <DialogTitle className="text-base">Cancel Engagement</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            Are you sure you want to cancel this engagement?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-1 gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={onConfirm}>
            Confirm Cancellation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

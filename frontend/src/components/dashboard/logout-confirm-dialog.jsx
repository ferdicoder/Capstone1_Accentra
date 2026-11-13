import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function LogoutConfirmDialog({ open, onOpenChange, onConfirm, submitting = false }) {
  const handleOpenChange = (nextOpen) => {
    // Block closing while the logout request is running.
    if (submitting && !nextOpen) return
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange} disablePointerDismissal>
      <DialogContent
        data-slot="logout-confirmation"
        className="w-[calc(100%-2rem)] gap-0 rounded-2xl bg-white p-6 text-center shadow-xl sm:max-w-sm"
      >
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-100">
          <LogOut className="size-6 text-forest-900" aria-hidden="true" />
        </div>

        <DialogHeader className="items-center gap-1 text-center sm:text-center">
          <DialogTitle className="text-lg font-bold">
            Are you sure you want to log out?
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            You will be signed out of your account.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-5 grid grid-cols-2 gap-3 sm:flex-none">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-full border-border bg-white text-sm font-semibold"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="h-10 w-full rounded-full bg-forest-900 text-sm font-semibold text-white hover:opacity-90"
            disabled={submitting}
            onClick={onConfirm}
          >
            {submitting ? "Logging out..." : "Log out"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
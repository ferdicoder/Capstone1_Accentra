import { Ban, CheckCircle2, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const fullNameOf = (user) =>
  [user?.firstName, user?.middleName, user?.lastName].filter(Boolean).join(" ") ||
  user?.name ||
  "this user"

/**
 * Confirmation dialog for deactivating / reactivating a firm user.
 * The confirm button stays disabled while the validation fails.
 */
export function FirmUserStatusDialog({
  open = false,
  onOpenChange,
  user,
  action = "deactivate",
  validationError = "",
  onConfirm,
  submitting = false,
  className,
  ...props
}) {
  const isDeactivate = action === "deactivate"
  const fullName = fullNameOf(user)

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="firm-user-status-dialog" className={className}>
        <DialogHeader>
          <DialogTitle>
            {isDeactivate ? "Deactivate user" : "Reactivate user"}
          </DialogTitle>
          <DialogDescription>
            {isDeactivate ? (
              <>
                <span className="font-medium text-foreground">{fullName}</span> will
                no longer be able to sign in until the account is reactivated.
              </>
            ) : (
              <>
                <span className="font-medium text-foreground">{fullName}</span> will
                regain access to the firm.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg bg-muted/40 px-3 py-2.5 text-sm">
          <p className="font-medium text-foreground">{fullName}</p>
          {user?.email && <p className="text-muted-foreground">{user.email}</p>}
          {user?.role && (
            <p className="text-muted-foreground">Role: {user.role}</p>
          )}
        </div>

        {validationError && (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 ring-1 ring-red-500/20 ring-inset"
          >
            {validationError}
          </p>
        )}

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
            variant={isDeactivate ? "destructive" : "default"}
            disabled={submitting || Boolean(validationError)}
            onClick={onConfirm}
            className={cn(!isDeactivate && "bg-forest-900 text-white hover:opacity-90")}
          >
            {submitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isDeactivate ? (
              <Ban className="size-4" />
            ) : (
              <CheckCircle2 className="size-4" />
            )}
            {submitting
              ? "Saving…"
              : isDeactivate
                ? "Deactivate"
                : "Reactivate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

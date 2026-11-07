import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFetchFirmSettings } from "@/hooks/useFirmSettings"

// Read-only viewer for firm_settings.terms_and_conditions — used by the
// signup flow's "Terms & Conditions" link.
export function TermsDialog({ open, onOpenChange }) {
  const { data: settings } = useFetchFirmSettings()
  const terms = settings?.termsAndConditions?.trim()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="terms-dialog"
        className="sm:max-w-2xl"
      >
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read these terms carefully before creating your account.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border bg-muted/30 p-4">
          {terms ? (
            <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
              {terms}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No terms and conditions have been published yet.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

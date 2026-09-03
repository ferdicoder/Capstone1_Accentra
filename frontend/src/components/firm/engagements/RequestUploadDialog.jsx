import { useState } from "react"
import { Loader2, Send } from "lucide-react"

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

export function RequestUploadDialog({ open, onOpenChange, taskName, onSubmit }) {
  const [submitting, setSubmitting] = useState(false)

  const handleSend = () => {
    setSubmitting(true)
    setTimeout(() => {
      onSubmit?.()
      setSubmitting(false)
    }, 400)
  }

  const handleCancel = () => {
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent data-slot="request-upload-dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Document</DialogTitle>
          <DialogDescription>
            Notify the client to upload the required document.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Task</span>
            <p className="text-sm font-medium text-foreground">{taskName}</p>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Message</span>
            <p className="text-sm text-foreground">
              Please upload the required document for verification.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          <Button type="button" variant="outline" disabled={submitting} onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitting}
            className="bg-[#02353C] text-white hover:opacity-90"
            onClick={handleSend}
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Sending…" : "Send Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

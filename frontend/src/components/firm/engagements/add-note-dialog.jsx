import { useState } from "react"
import { Loader2, StickyNote } from "lucide-react"

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
import { firmStaffMap } from "./engagement-variants"

const MAX_CHARS = 1000

export function AddNoteDialog({ open, onOpenChange, engagement, onSubmit }) {
  const [content, setContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const staffLabel = firmStaffMap[engagement?.assignedStaff] ?? "You"

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!content.trim()) newErrors.content = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    setTimeout(() => {
      onSubmit?.({
        id: `note-${Date.now()}`,
        engagementId: engagement?.id,
        content: content.trim(),
        author: staffLabel,
        createdAt: new Date().toISOString(),
      })
      setSubmitting(false)
      setContent("")
      setErrors({})
    }, 400)
  }

  const handleCancel = () => {
    setContent("")
    setErrors({})
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent data-slot="add-note-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Add a simple engagement-level note.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Note</label>
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setContent(e.target.value)
                  if (errors.content) setErrors((prev) => ({ ...prev, content: false }))
                }
              }}
              placeholder="Enter your note here..."
              rows={4}
              className={cn(
                "min-h-24 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                errors.content && "border-red-500 focus-visible:ring-red-500"
              )}
            />
            <div className="flex items-center justify-between">
              {errors.content && <p className="text-xs text-red-500">Note is required.</p>}
              <span className={cn("text-xs ml-auto", content.length >= MAX_CHARS ? "text-red-500" : "text-muted-foreground")}>
                {content.length} / {MAX_CHARS} characters
              </span>
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#02353C] text-white hover:opacity-90">
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Saving…" : "Save Note"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

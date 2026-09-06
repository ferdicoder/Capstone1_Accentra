import { useState } from "react"
import { FileText, Loader2, Send, StickyNote } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import { firmStaffMap } from "./engagement-variants"

const MAX_TITLE_CHARS = 100
const MAX_DESC_CHARS = 500

export function ActivityUpdateDialog({ open, onOpenChange, engagement, onSubmit }) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const staffLabel = firmStaffMap[engagement?.assignedStaff] ?? "You"
  const now = new Date()

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!title.trim()) newErrors.title = true
    if (!description.trim()) newErrors.description = true
    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    setSubmitting(true)
    setTimeout(() => {
      onSubmit?.({
        id: `act-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        createdAt: now.toISOString(),
        author: staffLabel,
      })
      setSubmitting(false)
      setTitle("")
      setDescription("")
      setErrors({})
    }, 300)
  }

  const handleCancel = () => {
    setTitle("")
    setDescription("")
    setErrors({})
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent data-slot="activity-update-dialog" showCloseButton={false} className="max-w-lg gap-0 p-0 overflow-hidden">
        {/* Header with icon */}
        <div className="bg-sidebar px-6 py-5 text-sidebar-foreground">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <StickyNote className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-sidebar-foreground">Post Activity Update</DialogTitle>
              <DialogDescription className="mt-0.5 text-xs text-sidebar-foreground/70">
                Share progress on this engagement
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 p-6">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel className="text-foreground">
                <FileText className="size-3.5 text-muted-foreground" />
                Title<span className="text-red-500">*</span>
              </FieldLabel>
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_TITLE_CHARS) {
                      setTitle(e.target.value)
                      if (errors.title) setErrors((prev) => ({ ...prev, title: false }))
                    }
                  }}
                  placeholder="e.g. Document verification completed"
                  className={cn(
                    "h-10 w-full rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    errors.title && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <div className="flex items-center justify-between">
                  {errors.title && <p className="text-xs text-red-500">Title is required.</p>}
                  <span className={cn("text-xs ml-auto", title.length >= MAX_TITLE_CHARS ? "text-red-500" : "text-muted-foreground")}>
                    {title.length}/{MAX_TITLE_CHARS}
                  </span>
                </div>
              </div>
            </Field>

            <Field>
              <FieldLabel className="text-foreground">
                <FileText className="size-3.5 text-muted-foreground" />
                Description<span className="text-red-500">*</span>
              </FieldLabel>
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_DESC_CHARS) {
                      setDescription(e.target.value)
                      if (errors.description) setErrors((prev) => ({ ...prev, description: false }))
                    }
                  }}
                  placeholder="Describe the work update, progress, or status change..."
                  rows={4}
                  className={cn(
                    "min-h-24 w-full resize-none rounded-lg border border-input bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    errors.description && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <div className="flex items-center justify-between">
                  {errors.description && <p className="text-xs text-red-500">Description is required.</p>}
                  <span className={cn("text-xs ml-auto", description.length >= MAX_DESC_CHARS ? "text-red-500" : "text-muted-foreground")}>
                    {description.length}/{MAX_DESC_CHARS}
                  </span>
                </div>
              </div>
            </Field>
          </FieldGroup>

          <DialogFooter className="flex-row justify-end gap-2.5 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={handleCancel}
              className="rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="gap-2 rounded-lg bg-[#02353C] text-white hover:opacity-90"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              {submitting ? "Posting…" : "Post Update"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

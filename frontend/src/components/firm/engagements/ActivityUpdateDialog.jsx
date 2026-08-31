import { useState } from "react"
import { Clock, FileText, Loader2, Send, StickyNote } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
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
  const previewDate = now.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
  const previewTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })

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
      <DialogContent data-slot="activity-update-dialog" className="max-w-lg gap-0 p-0 overflow-hidden">
        {/* Header with icon */}
        <div className="bg-[#02353C] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-white/15">
              <StickyNote className="size-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-white">Post Activity Update</DialogTitle>
              <DialogDescription className="text-white/70 text-xs mt-0.5">
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
                    "h-10 w-full rounded-lg border border-input bg-muted/30 px-3 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-[#02353C] focus:bg-white focus:ring-2 focus:ring-[#02353C]/20",
                    errors.title && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
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
                    "min-h-24 w-full resize-none rounded-lg border border-input bg-muted/30 px-3 py-2.5 text-sm transition-all outline-none placeholder:text-muted-foreground focus:border-[#02353C] focus:bg-white focus:ring-2 focus:ring-[#02353C]/20",
                    errors.description && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
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

          {/* Live Preview */}
          <div className="rounded-xl border border-[#02353C]/10 bg-[#02353C]/[0.03] p-4">
            <div className="mb-2.5 flex items-center gap-2">
              <div className="flex size-5 items-center justify-center rounded-md bg-[#02353C]/10">
                <StickyNote className="size-2.5 text-[#02353C]" />
              </div>
              <p className="text-xs font-semibold text-[#02353C]">Live Preview</p>
            </div>
            <div className="rounded-lg bg-white p-3 shadow-sm border border-border/50">
              <p className="text-sm font-medium text-foreground leading-snug">
                {title || <span className="text-muted-foreground italic">Update title</span>}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Clock className="size-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {previewDate} · {previewTime}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {description || <span className="italic">Description will appear here...</span>}
              </p>
              <p className="mt-2 text-xs text-muted-foreground/60">— {staffLabel}</p>
            </div>
          </div>

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
              className="gap-2 rounded-lg bg-[#02353C] text-white hover:bg-[#02353C]/90 shadow-sm"
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

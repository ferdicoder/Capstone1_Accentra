import { useState } from "react"
import { CalendarDays, Loader2, StickyNote } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { firmStaffMap } from "./engagement-variants"

const noteTypeOptions = [
  { value: "internal", label: "Internal Note" },
  { value: "client_communication", label: "Client Communication" },
  { value: "follow_up", label: "Follow-up Reminder" },
  { value: "compliance", label: "Compliance Note" },
  { value: "billing", label: "Billing Note" },
  { value: "document_review", label: "Document Review Note" },
]

const visibilityOptions = [
  { value: "internal", label: "Internal Only" },
  { value: "assigned_staff", label: "Assigned Staff" },
  { value: "firm", label: "Entire Firm" },
]

const staffOptions = Object.entries(firmStaffMap).map(([value, label]) => ({ value, label }))

const MAX_CHARS = 1000

export function AddNoteDialog({ open, onOpenChange, engagement, onSubmit }) {
  const [noteType, setNoteType] = useState("internal")
  const [content, setContent] = useState("")
  const [visibility, setVisibility] = useState("internal")
  const [relatedTo, setRelatedTo] = useState("")
  const [createReminder, setCreateReminder] = useState(false)
  const [reminderDate, setReminderDate] = useState("")
  const [assignTo, setAssignTo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  const activeType = noteTypeOptions.find((o) => o.value === noteType)
  const activeRelated = engagement?.documents
    ? [{ value: "", label: "General Engagement" }, ...engagement.documents.map((d) => ({ value: d.id, label: d.name }))]
    : [{ value: "", label: "General Engagement" }]

  const now = new Date()
  const previewDate = now.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
  const previewTime = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
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
        type: noteType,
        content: content.trim(),
        visibility,
        relatedTo: relatedTo || null,
        reminder: createReminder ? { date: reminderDate, assignTo } : null,
        createdAt: now.toISOString(),
        author: staffLabel,
      })
      setSubmitting(false)
      setContent("")
      setNoteType("internal")
      setVisibility("internal")
      setRelatedTo("")
      setCreateReminder(false)
      setReminderDate("")
      setAssignTo("")
      setErrors({})
    }, 400)
  }

  const handleCancel = () => {
    setContent("")
    setNoteType("internal")
    setVisibility("internal")
    setRelatedTo("")
    setCreateReminder(false)
    setReminderDate("")
    setAssignTo("")
    setErrors({})
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent data-slot="add-note-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Note</DialogTitle>
          <DialogDescription>
            Record an engagement update, internal note, or client communication.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Note Type</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="outline" className="h-8 w-full justify-between rounded-lg px-2.5 font-normal" />
                  }
                >
                  {activeType?.label ?? "Select type"}
                  <span className="size-4 opacity-60">▾</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-56">
                  {noteTypeOptions.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => setNoteType(option.value)}>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>

            <Field>
              <FieldLabel>
                Note Details<span className="text-red-500">*</span>
              </FieldLabel>
              <div className="flex flex-col gap-1.5">
                <textarea
                  value={content}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_CHARS) {
                      setContent(e.target.value)
                      if (errors.content) setErrors((prev) => ({ ...prev, content: false }))
                    }
                  }}
                  placeholder="Enter details about the engagement update, client communication, document concern, compliance issue, or internal observation..."
                  rows={4}
                  className={cn(
                    "min-h-24 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                    errors.content && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                <div className="flex items-center justify-between">
                  {errors.content && <p className="text-xs text-red-500">Note details are required.</p>}
                  <span className={cn("text-xs ml-auto", content.length >= MAX_CHARS ? "text-red-500" : "text-muted-foreground")}>
                    {content.length} / {MAX_CHARS} characters
                  </span>
                </div>
              </div>
            </Field>

            <Field>
              <FieldLabel>Visibility</FieldLabel>
              <div className="flex gap-4">
                {visibilityOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={visibility === option.value}
                      onChange={() => setVisibility(option.value)}
                      className="size-4 accent-[#02353C]"
                    />
                    <span className="text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Related To</FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button type="button" variant="outline" className="h-8 w-full justify-between rounded-lg px-2.5 font-normal" />
                  }
                >
                  {relatedTo ? activeRelated.find((o) => o.value === relatedTo)?.label ?? "Select" : "General Engagement"}
                  <span className="size-4 opacity-60">▾</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-56">
                  {activeRelated.map((option) => (
                    <DropdownMenuItem key={option.value} onClick={() => setRelatedTo(option.value)}>
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </Field>

            <Field>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createReminder}
                  onChange={(e) => setCreateReminder(e.target.checked)}
                  className="size-4 rounded accent-[#02353C]"
                />
                <span className="text-foreground">Create Follow-up Reminder</span>
              </label>
            </Field>

            {createReminder && (
              <div className="flex flex-col gap-4 rounded-lg border border-border bg-muted/30 p-4">
                <Field>
                  <FieldLabel>Reminder Date</FieldLabel>
                  <Input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="h-8"
                  />
                </Field>
                <Field>
                  <FieldLabel>Assign To</FieldLabel>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button type="button" variant="outline" className="h-8 w-full justify-between rounded-lg px-2.5 font-normal" />
                      }
                    >
                      {assignTo ? staffOptions.find((o) => o.value === assignTo)?.label ?? "Select" : "Select staff"}
                      <span className="size-4 opacity-60">▾</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-56">
                      {staffOptions.map((option) => (
                        <DropdownMenuItem key={option.value} onClick={() => setAssignTo(option.value)}>
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Field>
              </div>
            )}
          </FieldGroup>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2">
              <StickyNote className="size-3.5 text-muted-foreground" />
              <h4 className="text-xs font-semibold text-foreground">Activity Preview</h4>
            </div>
            <p className="text-sm text-foreground">
              {staffLabel} added an {activeType?.label ?? "Internal Note"}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {previewDate} · {previewTime}
            </p>
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

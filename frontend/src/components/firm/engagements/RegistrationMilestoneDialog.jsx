import { useState } from "react"

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
import { milestoneStatusOptions } from "./engagement-registration-variants"

export function RegistrationMilestoneDialog({ open, onOpenChange, milestone, onSave }) {
  const [status, setStatus] = useState(milestone?.status ?? "pending")
  const [completionDate, setCompletionDate] = useState(milestone?.completedDate ?? "")
  const [remarks, setRemarks] = useState(milestone?.remarks ?? "")

  const handleSave = (e) => {
    e.preventDefault()
    onSave?.({
      ...milestone,
      status,
      completedDate: status === "completed" ? completionDate : "",
      remarks: remarks.trim() || null,
    })
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="registration-milestone-dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Update Milestone</DialogTitle>
          <DialogDescription>
            Update the status of <span className="font-medium text-foreground">{milestone?.label}</span>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Milestone Name</FieldLabel>
              <p className="text-sm font-medium text-foreground">{milestone?.label ?? "—"}</p>
            </Field>

            <Field>
              <FieldLabel>Status</FieldLabel>
              <div className="flex gap-3">
                {milestoneStatusOptions.map((option) => (
                  <label key={option.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="milestone-status"
                      value={option.value}
                      checked={status === option.value}
                      onChange={() => setStatus(option.value)}
                      className="size-4 accent-[#02353C]"
                    />
                    <span className="text-foreground">{option.label}</span>
                  </label>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Completion Date</FieldLabel>
              <Input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="h-8"
                disabled={status !== "completed"}
              />
            </Field>

            <Field>
              <FieldLabel>Remarks (Optional)</FieldLabel>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any notes about this milestone..."
                rows={3}
                className="min-h-20 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#02353C] text-white hover:opacity-90">
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

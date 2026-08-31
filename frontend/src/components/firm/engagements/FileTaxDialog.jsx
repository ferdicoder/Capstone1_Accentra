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

export function FileTaxDialog({ open, onOpenChange, isVat, onSave }) {
  const [filingDate, setFilingDate] = useState("")
  const [filingNotes, setFilingNotes] = useState("")

  const handleSave = (e) => {
    e.preventDefault()
    onSave?.({
      filingDate,
      filingNotes: filingNotes.trim() || null,
    })
    onOpenChange?.(false)
    setFilingDate("")
    setFilingNotes("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="file-tax-dialog" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isVat ? "File VAT Return" : "File Tax Return"}</DialogTitle>
          <DialogDescription>
            Record the filing details for this {isVat ? "VAT" : "tax"} return.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Filing Date</FieldLabel>
              <Input
                type="date"
                value={filingDate}
                onChange={(e) => setFilingDate(e.target.value)}
                className="h-8"
                required
              />
            </Field>

            <Field>
              <FieldLabel>Filing Notes (Optional)</FieldLabel>
              <textarea
                value={filingNotes}
                onChange={(e) => setFilingNotes(e.target.value)}
                placeholder="Add any notes about the filing..."
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
              {isVat ? "File VAT Return" : "File Tax"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useState } from "react"

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
import { firmStaffMap } from "./engagement-variants"
import { nonVatTaxTreatments, vatFilingPeriods } from "./tax-filing-variants"

const staffOptions = Object.entries(firmStaffMap).map(([value, label]) => ({ value, label }))

export function ComputeTaxDialog({ open, onOpenChange, isVat, onContinue }) {
  const [filingPeriod, setFilingPeriod] = useState("")
  const [taxTreatment, setTaxTreatment] = useState("") // non-VAT
  const [vatFilingPeriod, setVatFilingPeriod] = useState("") // VAT
  const [assignedStaff, setAssignedStaff] = useState("")
  const [internalNotes, setInternalNotes] = useState("")
  const [errors, setErrors] = useState({})

  const handleContinue = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!filingPeriod.trim()) newErrors.filingPeriod = true
    if (isVat && !vatFilingPeriod) newErrors.vatFilingPeriod = true
    if (!isVat && !taxTreatment) newErrors.taxTreatment = true
    if (!assignedStaff) newErrors.assignedStaff = true

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) return

    onContinue?.({
      filingPeriod: filingPeriod.trim(),
      filingType: isVat ? vatFilingPeriod : taxTreatment,
      assignedStaff,
      internalNotes: internalNotes.trim() || null,
    })

    setFilingPeriod("")
    setTaxTreatment("")
    setVatFilingPeriod("")
    setAssignedStaff("")
    setInternalNotes("")
    setErrors({})
  }

  const handleCancel = () => {
    setFilingPeriod("")
    setTaxTreatment("")
    setVatFilingPeriod("")
    setAssignedStaff("")
    setInternalNotes("")
    setErrors({})
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent data-slot="compute-tax-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isVat ? "Generate VAT Computation" : "Generate Tax Computation"}</DialogTitle>
          <DialogDescription>
            {isVat
              ? "Select the VAT filing period and enter filing details before proceeding."
              : "Select the applicable tax treatment and enter filing details before proceeding."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleContinue} className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1">
          <FieldGroup>
            <Field>
              <FieldLabel>Filing Period<span className="text-red-500">*</span></FieldLabel>
              <Input
                type="text"
                value={filingPeriod}
                onChange={(e) => { setFilingPeriod(e.target.value); if (errors.filingPeriod) setErrors((p) => ({ ...p, filingPeriod: false })) }}
                placeholder="e.g. January 2025, Q1 2025"
                className={cn("h-8", errors.filingPeriod && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.filingPeriod && <p className="text-xs text-red-500">Filing period is required.</p>}
            </Field>

            {isVat ? (
              <Field>
                <FieldLabel>VAT Filing Period<span className="text-red-500">*</span></FieldLabel>
                <div className="flex flex-col gap-3">
                  {vatFilingPeriods.map((period) => (
                    <label key={period.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="vat-filing-period"
                        value={period.value}
                        checked={vatFilingPeriod === period.value}
                        onChange={() => { setVatFilingPeriod(period.value); if (errors.vatFilingPeriod) setErrors((p) => ({ ...p, vatFilingPeriod: false })) }}
                        className="size-4 accent-[#02353C]"
                      />
                      <span className="text-foreground">{period.label}</span>
                    </label>
                  ))}
                </div>
                {errors.vatFilingPeriod && <p className="text-xs text-red-500">Select a VAT filing period.</p>}
              </Field>
            ) : (
              <Field>
                <FieldLabel>Tax Treatment<span className="text-red-500">*</span></FieldLabel>
                <div className="flex flex-col gap-3">
                  {nonVatTaxTreatments.map((treatment) => (
                    <label key={treatment.value} className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="tax-treatment"
                        value={treatment.value}
                        checked={taxTreatment === treatment.value}
                        onChange={() => { setTaxTreatment(treatment.value); if (errors.taxTreatment) setErrors((p) => ({ ...p, taxTreatment: false })) }}
                        className="size-4 accent-[#02353C]"
                      />
                      <span className="text-foreground">{treatment.label}</span>
                    </label>
                  ))}
                </div>
                {errors.taxTreatment && <p className="text-xs text-red-500">Select the applicable tax treatment.</p>}
              </Field>
            )}

            <Field>
              <FieldLabel>Assigned Staff<span className="text-red-500">*</span></FieldLabel>
              <select
                value={assignedStaff}
                onChange={(e) => { setAssignedStaff(e.target.value); if (errors.assignedStaff) setErrors((p) => ({ ...p, assignedStaff: false })) }}
                className={cn("h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50", errors.assignedStaff && "border-red-500 focus-visible:ring-red-500")}
              >
                <option value="">Select staff</option>
                {staffOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.assignedStaff && <p className="text-xs text-red-500">Assign a staff member.</p>}
            </Field>

            <Field>
              <FieldLabel>Internal Notes (Optional)</FieldLabel>
              <textarea
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Add any internal notes about this computation..."
                rows={3}
                className="min-h-20 w-full resize-none rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#02353C] text-white hover:opacity-90">
              Continue to Computation →
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

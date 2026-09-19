import { useState } from "react"
import { Calculator } from "lucide-react"

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
import { nonVatTaxTreatments, vatFilingPeriods, withholdingTaxClassifications, getWithholdingRate } from "./tax-filing-variants"

const formatCurrency = (value) => {
  const num = Number(value)
  if (!Number.isFinite(num)) return "₱0.00"
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SummaryRow({ label, value, highlight }) {
  return (
    <div className={cn("flex items-center justify-between py-2", highlight && "border-t border-border pt-3 mt-1")}>
      <span className={cn("text-sm", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
      <span className={cn("text-sm", highlight ? "font-bold text-[#02353C]" : "font-medium text-foreground")}>{value}</span>
    </div>
  )
}

function NonVatForm({ setupData, onSave, onCancel }) {
  const [grossSales, setGrossSales] = useState("")
  const [withholdingClassification, setWithholdingClassification] = useState("")
  const [taxBase, setTaxBase] = useState("")
  const [withholdingRate, setWithholdingRate] = useState("")
  const [taxRate, setTaxRate] = useState("3")

  const gross = Number(grossSales) || 0
  const base = Number(taxBase) || gross
  const rate = Number(taxRate) || 0
  const percentageTax = base * (rate / 100)
  const wtaxBase = Number(taxBase) || gross
  const wtaxRate = Number(withholdingRate) || 0
  const creditableWithheld = wtaxBase * (wtaxRate / 100)
  const netTaxPayable = percentageTax - creditableWithheld

  const handleClassificationChange = (value) => {
    setWithholdingClassification(value)
    const found = withholdingTaxClassifications.find(c => c.value === value)
    if (found) {
      setWithholdingRate(String(found.rate))
      setTaxBase(grossSales || "")
    }
  }

  const taxTreatmentLabel = nonVatTaxTreatments.find(t => t.value === setupData?.filingType)?.label ?? setupData?.filingType ?? "—"

  const handleSave = () => {
    onSave?.({
      ...setupData,
      type: "non_vat",
      taxTreatment: setupData?.filingType,
      grossSales: gross,
      taxBase: base,
      taxRate: rate,
      percentageTax,
      withholdingClassification,
      withholdingTaxBase: wtaxBase,
      withholdingTaxRate: wtaxRate,
      creditableWithheld,
      netTaxPayable,
    })
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        <p className="text-xs text-muted-foreground mb-1">Tax Treatment</p>
        <p className="text-sm font-medium text-foreground">{taxTreatmentLabel}</p>
      </div>

      <div className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel>Gross Sales (₱)</FieldLabel>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={grossSales}
              onChange={(e) => setGrossSales(e.target.value)}
              placeholder="0.00"
              className="h-8"
            />
          </Field>
          <Field>
            <FieldLabel>Percentage Tax Rate (%)</FieldLabel>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="3"
              className="h-8"
              disabled={setupData?.filingType !== "3_percent"}
            />
            {setupData?.filingType !== "3_percent" && (
              <p className="text-xs text-muted-foreground">Rate varies by tax treatment.</p>
            )}
          </Field>
        </FieldGroup>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-xs font-semibold text-foreground">Creditable Tax Withheld</h4>
        <FieldGroup>
          <Field>
            <FieldLabel>Tax Type / ATC</FieldLabel>
            <select
              value={withholdingClassification}
              onChange={(e) => handleClassificationChange(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Select classification</option>
              {withholdingTaxClassifications.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Tax Base (₱)</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={taxBase}
                onChange={(e) => setTaxBase(e.target.value)}
                placeholder={grossSales || "0.00"}
                className="h-8"
              />
            </Field>
            <Field>
              <FieldLabel>Applicable Rate (%)</FieldLabel>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={withholdingRate}
                onChange={(e) => setWithholdingRate(e.target.value)}
                placeholder="0"
                className="h-8"
              />
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Calculator className="size-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold text-foreground">Tax Computation Summary</h4>
        </div>
        <div className="divide-y divide-border/60">
          <SummaryRow label="Gross Sales" value={formatCurrency(gross)} />
          <SummaryRow label="Tax Base" value={formatCurrency(base)} />
          <SummaryRow label="Tax Rate" value={`${rate}%`} />
          <SummaryRow label="Percentage Tax Due" value={formatCurrency(percentageTax)} highlight />
          <SummaryRow label="Creditable Tax Withheld" value={formatCurrency(creditableWithheld)} />
          <SummaryRow label="Net Percentage Tax Payable" value={formatCurrency(netTaxPayable)} highlight />
        </div>
      </div>

      <p className="text-xs text-muted-foreground/70 italic">
        Assisted computation for the selected tax treatment. Figures entered and validated by authorized firm personnel. Please verify before filing with the BIR.
      </p>

      <DialogFooter className="flex-row justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" className="bg-[#02353C] text-white hover:opacity-90" onClick={handleSave}>Save Computation</Button>
      </DialogFooter>
    </>
  )
}

function VatForm({ setupData, onSave, onCancel }) {
  const [vatableSales, setVatableSales] = useState("")
  const [outputVat, setOutputVat] = useState("")
  const [inputVat, setInputVat] = useState("")
  const [zeroRatedSales, setZeroRatedSales] = useState("")
  const [vatExemptSales, setVatExemptSales] = useState("")

  const vatable = Number(vatableSales) || 0
  const output = Number(outputVat) || 0
  const input = Number(inputVat) || 0
  const zeroRated = Number(zeroRatedSales) || 0
  const exempt = Number(vatExemptSales) || 0

  const vatPayable = output - input
  const filingPeriodLabel = vatFilingPeriods.find(p => p.value === setupData?.filingType)?.label ?? setupData?.filingType ?? "—"

  const handleSave = () => {
    onSave?.({
      ...setupData,
      type: "vat",
      vatableSales: vatable,
      outputVat: output,
      inputVat: input,
      zeroRatedSales: zeroRated,
      vatExemptSales: exempt,
      vatPayable,
    })
  }

  return (
    <>
      <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
        <p className="text-xs text-muted-foreground mb-1">VAT Filing Period</p>
        <p className="text-sm font-medium text-foreground">{filingPeriodLabel}</p>
      </div>

      <div className="flex flex-col gap-4">
        <FieldGroup>
          <Field>
            <FieldLabel>VATable Sales (₱)</FieldLabel>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={vatableSales}
              onChange={(e) => setVatableSales(e.target.value)}
              placeholder="0.00"
              className="h-8"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Output VAT (₱)</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={outputVat}
                onChange={(e) => setOutputVat(e.target.value)}
                placeholder="0.00"
                className="h-8"
              />
            </Field>
            <Field>
              <FieldLabel>Allowable Input VAT (₱)</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={inputVat}
                onChange={(e) => setInputVat(e.target.value)}
                placeholder="0.00"
                className="h-8"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel>Zero-Rated Sales (₱)</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={zeroRatedSales}
                onChange={(e) => setZeroRatedSales(e.target.value)}
                placeholder="0.00"
                className="h-8"
              />
            </Field>
            <Field>
              <FieldLabel>VAT-Exempt Sales (₱)</FieldLabel>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={vatExemptSales}
                onChange={(e) => setVatExemptSales(e.target.value)}
                placeholder="0.00"
                className="h-8"
              />
            </Field>
          </div>
        </FieldGroup>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Calculator className="size-3.5 text-muted-foreground" />
          <h4 className="text-xs font-semibold text-foreground">VAT Computation Summary</h4>
        </div>
        <div className="divide-y divide-border/60">
          <SummaryRow label="VATable Sales" value={formatCurrency(vatable)} />
          <SummaryRow label="Output VAT" value={formatCurrency(output)} />
          <SummaryRow label="Allowable Input VAT" value={formatCurrency(input)} />
          <SummaryRow label="VAT Payable" value={formatCurrency(vatPayable)} highlight />
          {zeroRated > 0 && <SummaryRow label="Zero-Rated Sales" value={formatCurrency(zeroRated)} />}
          {exempt > 0 && <SummaryRow label="VAT-Exempt Sales" value={formatCurrency(exempt)} />}
        </div>
      </div>

      <p className="text-xs text-muted-foreground/70 italic">
        Figures entered and validated by authorized firm personnel. Please verify before filing with the BIR.
      </p>

      <DialogFooter className="flex-row justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="button" className="bg-[#02353C] text-white hover:opacity-90" onClick={handleSave}>Save Computation</Button>
      </DialogFooter>
    </>
  )
}

export function TaxComputationDialog({ open, onOpenChange, isVat, setupData, onSave }) {
  const handleCancel = () => {
    onOpenChange?.(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent data-slot="tax-computation-dialog" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tax Computation — {isVat ? "VAT" : "Non-VAT"}</DialogTitle>
          <DialogDescription>
            {isVat
              ? "Enter the financial figures for the VAT computation."
              : "Enter the financial figures for the percentage tax computation."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1">
          {isVat ? (
            <VatForm setupData={setupData} onSave={onSave} onCancel={handleCancel} />
          ) : (
            <NonVatForm setupData={setupData} onSave={onSave} onCancel={handleCancel} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

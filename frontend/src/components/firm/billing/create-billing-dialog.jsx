import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
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

import { INVOICE_TYPES, invoiceTypeLabels } from "./billing-variants"

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

/**
 * "Create Billing" modal form. Fully controlled — the parent owns
 * `open`/`onOpenChange` and persists the values via onSubmit. Mirrors
 * FirmUserCreateDialog's structure, validation, and styling.
 *
 * @param {Array} engagements - Available engagements for the selector.
 * @param {Array} billings - Existing billing records (duplicate safety check).
 * @param {Function} onSubmit - ({ engagement_id, invoice_type, amount, due_date, payment_reference }) => void
 * @param {boolean} submitting - Disables the form and shows a spinner.
 */
export function CreateBillingDialog({
  open = false,
  onOpenChange,
  onSubmit,
  engagements = [],
  billings = [],
  submitting = false,
  error,
}) {
  // Dialog content unmounts when closed, so this state resets on every open.
  const [engagementId, setEngagementId] = useState("")
  const [invoiceType, setInvoiceType] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [errors, setErrors] = useState({})

  const selectedEngagement = engagements.find((e) => e.id === engagementId)
  const engagementsUnavailable = engagements.length === 0

  const engagementLabel = (engagement) =>
    `${engagement.engagementNumber ?? engagement.id} — ${engagement.serviceName ?? "Untitled service"}`

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedAmount = amount.trim()
    const numericAmount = Number(trimmedAmount)

    const duplicate = billings.some(
      (b) =>
        b.engagement_id === engagementId &&
        b.invoice_type === invoiceType &&
        b.status !== "cancelled"
    )

    const newErrors = {
      engagement: !engagementId,
      invoiceType: !invoiceType || duplicate,
      amount:
        !trimmedAmount ||
        !AMOUNT_PATTERN.test(trimmedAmount) ||
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0,
      dueDate: !dueDate || Number.isNaN(new Date(dueDate).getTime()),
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    // The Admin does not submit payment references — they are supplied by
    // the payer/payment-submission flow on record creation and thereafter.
    onSubmit?.({
      engagement_id: engagementId,
      invoice_type: invoiceType,
      amount: numericAmount,
      due_date: dueDate,
      payment_reference: "",
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="create-billing-dialog">
        <DialogHeader>
          <DialogTitle>Create Billing</DialogTitle>
          <DialogDescription>
            Create a billing record for an engagement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <FieldGroup>
            <Field>
              <FieldLabel>
                Engagement<span className="text-red-500">*</span>
              </FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting || engagementsUnavailable}
                      className={cn(
                        "h-8 w-full cursor-pointer justify-between rounded-lg px-2.5 font-normal",
                        errors.engagement && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  }
                >
                  <span className="truncate">
                    {selectedEngagement
                      ? engagementLabel(selectedEngagement)
                      : "Select engagement"}
                  </span>
                  <ChevronDown className="size-4 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-72 min-w-72 overflow-y-auto">
                  {engagements.map((engagement) => (
                    <DropdownMenuItem
                      key={engagement.id}
                      onClick={() => setEngagementId(engagement.id)}
                      className="cursor-pointer"
                    >
                      <span className="flex flex-col">
                        <span>{engagementLabel(engagement)}</span>
                        {engagement.business?.businessName && (
                          <span className="text-xs text-muted-foreground">
                            {engagement.business.businessName}
                          </span>
                        )}
                      </span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.engagement && <p className="text-sm text-red-500">Please select an engagement.</p>}
              {engagementsUnavailable && (
                <p className="text-sm text-muted-foreground">No engagements available.</p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>
                  Invoice Type<span className="text-red-500">*</span>
                </FieldLabel>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        className={cn(
                          "h-8 w-full cursor-pointer justify-between rounded-lg px-2.5 font-normal",
                          errors.invoiceType && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                    }
                  >
                    {invoiceType ? invoiceTypeLabels[invoiceType] : "Select invoice type"}
                    <ChevronDown className="size-4 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-40">
                    {INVOICE_TYPES.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => setInvoiceType(type)}
                        className="cursor-pointer"
                      >
                        {invoiceTypeLabels[type]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {errors.invoiceType && (
                  <p className="text-sm text-red-500">
                    {duplicateInvoiceType(billings, engagementId, invoiceType)
                      ? "An active billing with this invoice type already exists for the selected engagement."
                      : "Please select an invoice type."}
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="billing-amount">
                  Amount<span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="billing-amount"
                  inputMode="decimal"
                  placeholder="2500.00"
                  value={amount}
                  onChange={(event) => {
                    // Numbers only: digits and at most one decimal point (max 2 places).
                    const cleaned = event.target.value
                      .replace(/[^0-9.]/g, "")
                      .replace(/(\..*)\./g, "$1")
                      .replace(/^(\d+\.\d{0,2}).*$/, "$1")
                    setAmount(cleaned)
                  }}
                  disabled={submitting}
                  className={cn(errors.amount && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500">Enter a valid amount greater than 0.</p>
                )}
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="billing-due-date">
                  Due Date<span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="billing-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  disabled={submitting}
                  className={cn(errors.dueDate && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.dueDate && <p className="text-sm text-red-500">Please select a due date.</p>}
              </Field>
            </div>
          </FieldGroup>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || engagementsUnavailable}
              className="cursor-pointer bg-forest-900 text-white hover:opacity-90"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Creating…" : "Create Billing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function duplicateInvoiceType(billings, engagementId, invoiceType) {
  if (!engagementId || !invoiceType) return false
  return billings.some(
    (b) =>
      b.engagement_id === engagementId &&
      b.invoice_type === invoiceType &&
      b.status !== "cancelled"
  )
}

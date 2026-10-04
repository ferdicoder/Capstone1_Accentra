import { useEffect, useMemo, useState } from "react"
import { ChevronDown, Loader2, Search } from "lucide-react"

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

export function CreateBillingDialog({
  open = false,
  onOpenChange,
  onSubmit,
  engagements = [],
  billings = [],
  submitting = false,
  error,
  initialEngagementId = "",
}) {
  const [engagementId, setEngagementId] = useState(initialEngagementId)
  const [engagementSearch, setEngagementSearch] = useState("")
  const [invoiceType, setInvoiceType] = useState("")
  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [errors, setErrors] = useState({})

  const engagementsUnavailable = engagements.length === 0

  const selectedEngagement = engagements.find(
    (engagement) => engagement.id === engagementId
  )

  /*
   * Display label for an engagement.
   */
  const engagementLabel = (engagement) =>
    `${engagement.engagementNumber ?? engagement.id} — ${
      engagement.serviceName ?? "Untitled service"
    }`

  /*
   * Filter engagements based on:
   * - Engagement number
   * - Service name
   * - Business name
   * - Client first name
   * - Client last name
   */
  const filteredEngagements = useMemo(() => {
    const query = engagementSearch.trim().toLowerCase()

    if (!query) return []

    return engagements.filter((engagement) => {
      const searchableText = [
        engagement.engagementNumber,
        engagement.serviceName,
        engagement.business?.businessName,
        engagement.client?.firstName,
        engagement.client?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [engagementSearch, engagements])

  /*
   * Reset / initialize the dialog whenever it opens.
   */
  useEffect(() => {
    if (!open) return

    setEngagementId(initialEngagementId || "")
    setEngagementSearch("")
    setInvoiceType("")
    setAmount("")
    setDueDate("")
    setErrors({})
  }, [open, initialEngagementId])

  /*
   * Select an engagement from the search results.
   */
  const handleSelectEngagement = (engagement) => {
    setEngagementId(engagement.id)
    setEngagementSearch("")

    setErrors((prev) => ({
      ...prev,
      engagement: false,
    }))
  }

  /*
   * Handle typing into the engagement search field.
   *
   * If an engagement was already selected and the user starts typing,
   * clear the previous selection so they can choose another one.
   */
  const handleEngagementSearch = (value) => {
    setEngagementSearch(value)

    if (selectedEngagement) {
      setEngagementId("")
    }

    if (errors.engagement) {
      setErrors((prev) => ({
        ...prev,
        engagement: false,
      }))
    }
  }

  /*
   * Submit billing form.
   */
  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedAmount = amount.trim()
    const numericAmount = Number(trimmedAmount)

    const duplicate = billings.some(
      (billing) =>
        billing.engagement_id === engagementId &&
        billing.invoice_type === invoiceType &&
        billing.status !== "cancelled"
    )

    const newErrors = {
      engagement: !engagementId,

      invoiceType: !invoiceType || duplicate,

      amount:
        !trimmedAmount ||
        !AMOUNT_PATTERN.test(trimmedAmount) ||
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0,

      dueDate:
        !dueDate ||
        Number.isNaN(new Date(dueDate).getTime()),
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some(Boolean)) return

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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Billing</DialogTitle>

          <DialogDescription>
            Create an invoice for an engagement.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4">

            {/* ENGAGEMENT */}
            <Field>
              <FieldLabel>
                Engagement
                <span className="text-red-500">*</span>
              </FieldLabel>

              <div className="relative">
                <div className="relative">
                  <Search
                    className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />

                  <Input
                    placeholder="Search engagement..."
                    value={
                      selectedEngagement
                        ? engagementLabel(selectedEngagement)
                        : engagementSearch
                    }
                    onChange={(event) =>
                      handleEngagementSearch(event.target.value)
                    }
                    disabled={submitting || engagementsUnavailable}
                    className={cn(
                      "h-8 rounded-lg pl-8",
                      errors.engagement &&
                        "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                </div>

                {/* SEARCH RESULTS */}
                {engagementSearch.trim() && !selectedEngagement && (
                  <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border bg-popover shadow-md">
                    {filteredEngagements.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto p-1">
                        {filteredEngagements.map((engagement) => (
                          <button
                            key={engagement.id}
                            type="button"
                            onClick={() =>
                              handleSelectEngagement(engagement)
                            }
                            className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-muted"
                          >
                            <span className="text-sm font-medium">
                              {engagementLabel(engagement)}
                            </span>

                            {engagement.business?.businessName && (
                              <span className="text-xs text-muted-foreground">
                                {engagement.business.businessName}
                              </span>
                            )}

                            {(engagement.client?.firstName ||
                              engagement.client?.lastName) && (
                              <span className="text-xs text-muted-foreground">
                                {[
                                  engagement.client?.firstName,
                                  engagement.client?.lastName,
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="px-3 py-3 text-sm text-muted-foreground">
                        No engagements found.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {errors.engagement && (
                <p className="text-sm text-red-500">
                  Please select an engagement.
                </p>
              )}

              {engagementsUnavailable && (
                <p className="text-sm text-muted-foreground">
                  No engagements available.
                </p>
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

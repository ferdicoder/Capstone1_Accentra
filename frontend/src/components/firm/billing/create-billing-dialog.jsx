
import { useEffect, useMemo, useRef, useState } from "react"
import { Plus, Search, X } from "lucide-react"

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

import {
  INVOICE_TYPES,
  invoiceTypeLabels,
} from "./billing-variants"

const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
]

const CURRENT_YEAR = new Date().getFullYear()

const YEARS = [
  CURRENT_YEAR - 1,
  CURRENT_YEAR,
  CURRENT_YEAR + 1,
]

function getEngagementClientId(engagement) {
  return (
    engagement?.client_id ??
    engagement?.client?.id ??
    null
  )
}

export function CreateBillingDialog({
  open = false,
  onOpenChange,
  onSubmit,
  engagements = [],
  clients = [],
  billings = [],
  submitting = false,
  error,
  initialEngagementId = "",
}) {
  const now = new Date()
  const currentBillingMonth = now.getMonth() + 1
  const currentBillingYear = now.getFullYear()

  const engagementSearchRef = useRef(null)

  // Service Fee supports multiple engagements.
  const [engagementIds, setEngagementIds] = useState(
    initialEngagementId ? [initialEngagementId] : []
  )
  const [engagementSearch, setEngagementSearch] = useState("")

  // Retainer Fee remains client + billing period based.
  const [clientId, setClientId] = useState("")
  const [clientSearch, setClientSearch] = useState("")

  const [invoiceType, setInvoiceType] = useState("")
  const [billingMonth, setBillingMonth] = useState(
    String(currentBillingMonth)
  )
  const [billingYear, setBillingYear] = useState(
    String(currentBillingYear)
  )

  const [amount, setAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [errors, setErrors] = useState({})

  const isServiceFee = invoiceType === "service_fee"
  const isRetainerFee = invoiceType === "retainer_fee"

  const engagementsUnavailable = engagements.length === 0
  const clientsUnavailable = clients.length === 0

  const selectedEngagements = engagements.filter(
    (engagement) => engagementIds.includes(engagement.id)
  )

  const selectedClient = clients.find(
    (client) => client.id === clientId
  )

  const engagementLabel = (engagement) =>
    `${engagement.engagementNumber ?? engagement.id} — ${
      engagement.serviceName ?? "Untitled service"
    }`

  const clientLabel = (client) =>
    `${client.firstName ?? ""} ${client.lastName ?? ""}`.trim() ||
    client.email ||
    "Unnamed client"

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

  const filteredClients = useMemo(() => {
    const query = clientSearch.trim().toLowerCase()

    if (!query) return []

    return clients.filter((client) => {
      const searchableText = [
        client.firstName,
        client.lastName,
        client.email,
        client.business?.businessName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(query)
    })
  }, [clientSearch, clients])

  const selectedMonthLabel =
    MONTHS.find(
      (month) => Number(month.value) === Number(billingMonth)
    )?.label ?? ""

  const selectedBillingPeriod =
    billingMonth && billingYear
      ? `${selectedMonthLabel} ${billingYear}`
      : ""

  // Prevent an engagement from being billed twice
  // through a non-cancelled Service Fee invoice.
  const duplicateServiceFee = isServiceFee &&
    engagementIds.some((selectedId) =>
      billings.some(
        (billing) =>
          billing.invoice_type === "service_fee" &&
          billing.status !== "cancelled" &&
          (
            billing.engagement_ids?.includes(selectedId) ||
            billing.engagement_id === selectedId
          )
      )
    )

  // Retainer duplicate check remains unchanged.
  const duplicateRetainer =
    isRetainerFee &&
    billings.some(
      (billing) =>
        billing.invoice_type === "retainer_fee" &&
        billing.client_id === clientId &&
        billing.billing_month === Number(billingMonth) &&
        billing.billing_year === Number(billingYear) &&
        billing.status !== "cancelled"
    )

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedDueDate = dueDate
    ? new Date(`${dueDate}T00:00:00`)
    : null

  const dueDateInvalid =
    !selectedDueDate ||
    Number.isNaN(selectedDueDate.getTime()) ||
    selectedDueDate < today

  useEffect(() => {
    if (!open) return

    setEngagementIds(
      initialEngagementId ? [initialEngagementId] : []
    )
    setEngagementSearch("")

    setInvoiceType("")
    setClientId("")
    setClientSearch("")

    setBillingMonth(String(currentBillingMonth))
    setBillingYear(String(currentBillingYear))

    setAmount("")
    setDueDate("")
    setErrors({})
  }, [
    open,
    initialEngagementId,
    currentBillingMonth,
    currentBillingYear,
  ])

  const handleInvoiceTypeChange = (value) => {
    setInvoiceType(value)

    // Clear fields belonging to the previous billing type.
    setEngagementIds([])
    setEngagementSearch("")
    setClientId("")
    setClientSearch("")

    setBillingMonth(String(currentBillingMonth))
    setBillingYear(String(currentBillingYear))

    setErrors({})
  }

  const handleSelectEngagement = (engagement) => {
    if (engagementIds.includes(engagement.id)) return

    const firstEngagement = selectedEngagements[0]

    if (firstEngagement) {
      const firstClientId = getEngagementClientId(firstEngagement)
      const candidateClientId = getEngagementClientId(engagement)

      // Require known client IDs so engagements cannot be
      // accidentally combined when ownership is unknown.
      if (
        !firstClientId ||
        !candidateClientId ||
        firstClientId !== candidateClientId
      ) {
        setErrors((previous) => ({
          ...previous,
          engagement:
            "Select engagements belonging to the same client.",
        }))
        return
      }
    }

    setEngagementIds((previous) => [
      ...previous,
      engagement.id,
    ])
    setEngagementSearch("")

    setErrors((previous) => ({
      ...previous,
      engagement: false,
    }))
  }

  const handleRemoveEngagement = (id) => {
    setEngagementIds((previous) =>
      previous.filter((engagementId) => engagementId !== id)
    )

    setErrors((previous) => ({
      ...previous,
      engagement: false,
    }))
  }

  const handleEngagementSearch = (value) => {
    setEngagementSearch(value)

    setErrors((previous) => ({
      ...previous,
      engagement: false,
    }))
  }

  const handleSelectClient = (client) => {
    setClientId(client.id)
    setClientSearch("")

    setErrors((previous) => ({
      ...previous,
      client: false,
      billingPeriod: false,
    }))
  }

  const handleClientSearch = (value) => {
    setClientSearch(value)

    if (selectedClient) {
      setClientId("")
    }

    setErrors((previous) => ({
      ...previous,
      client: false,
    }))
  }

  const handleBillingMonthChange = (value) => {
    setBillingMonth(String(value))

    setErrors((previous) => ({
      ...previous,
      billingPeriod: false,
    }))
  }

  const handleBillingYearChange = (value) => {
    setBillingYear(String(value))

    setErrors((previous) => ({
      ...previous,
      billingPeriod: false,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const trimmedAmount = amount.trim()
    const numericAmount = Number(trimmedAmount)

    const newErrors = {
      invoiceType: !invoiceType,

      engagement:
        isServiceFee &&
        (engagementIds.length === 0 || duplicateServiceFee),

      client: isRetainerFee && !clientId,

      billingPeriod:
        isRetainerFee &&
        (
          !billingMonth ||
          !billingYear ||
          duplicateRetainer
        ),

      amount:
        !trimmedAmount ||
        !AMOUNT_PATTERN.test(trimmedAmount) ||
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0,

      dueDate: dueDateInvalid,
    }

    setErrors(newErrors)

    if (Object.values(newErrors).some(Boolean)) return

    onSubmit?.({
      // Legacy field: first engagement for existing consumers.
      engagement_id: isServiceFee
        ? engagementIds[0] ?? null
        : null,

      // New field: all engagements in this Service Fee invoice.
      engagement_ids: isServiceFee
        ? engagementIds
        : [],

      // Retainer Fee remains client + billing period based.
      client_id: isRetainerFee ? clientId : null,

      billing_month: isRetainerFee
        ? Number(billingMonth)
        : null,

      billing_year: isRetainerFee
        ? Number(billingYear)
        : null,

      invoice_type: invoiceType,
      amount: numericAmount,
      due_date: dueDate,

      payment_method: null,
      payment_reference: "",
      payment_proof_url: "",
    })
  }

  const submitDisabled =
    submitting ||
    (isServiceFee && engagementsUnavailable) ||
    (isRetainerFee && clientsUnavailable)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Billing</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup className="space-y-4">
            {/* BILLING TYPE */}
            <Field>
              <FieldLabel>
                Billing Type <span className="text-red-500">*</span>
              </FieldLabel>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-between font-normal",
                      !invoiceType && "text-muted-foreground"
                    )}
                  >
                    {invoiceType
                      ? invoiceTypeLabels[invoiceType]
                      : "Select billing type"}
                    <span className="text-xs opacity-60">▼</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)]">
                  {INVOICE_TYPES.map((type) => (
                    <DropdownMenuItem
                      key={type}
                      onClick={() => handleInvoiceTypeChange(type)}
                    >
                      {invoiceTypeLabels[type]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {errors.invoiceType && (
                <p className="text-xs text-red-500">
                  Please select an invoice type.
                </p>
              )}
            </Field>

            {/* SERVICE FEE: MULTIPLE ENGAGEMENTS */}
            {isServiceFee && (
              <Field>
                <FieldLabel>
                  Engagements <span className="text-red-500">*</span>
                </FieldLabel>

                {selectedEngagements.length > 0 && (
                  <div className="space-y-2">
                    {selectedEngagements.map((engagement) => (
                      <div
                        key={engagement.id}
                        className="flex items-center gap-3 rounded-md border p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">
                            {engagementLabel(engagement)}
                          </p>

                          {engagement.business?.businessName && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {engagement.business.businessName}
                            </p>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={() =>
                            handleRemoveEngagement(engagement.id)
                          }
                          aria-label={`Remove ${engagementLabel(engagement)}`}
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                  <Input
                    ref={engagementSearchRef}
                    value={engagementSearch}
                    onChange={(event) =>
                      handleEngagementSearch(event.target.value)
                    }
                    placeholder="Search engagement..."
                    className="pl-9"
                    disabled={engagementsUnavailable}
                  />
                </div>

                {engagementSearch &&
                  filteredEngagements.length > 0 && (
                    <div className="mt-1 max-h-48 overflow-y-auto rounded-md border bg-background">
                      {filteredEngagements.map((engagement) => {
                        const alreadySelected =
                          engagementIds.includes(engagement.id)

                        const firstEngagement = selectedEngagements[0]
                        const firstClientId =
                          getEngagementClientId(firstEngagement)
                        const candidateClientId =
                          getEngagementClientId(engagement)

                        const differentClient =
                          Boolean(firstEngagement) &&
                          (
                            !firstClientId ||
                            !candidateClientId ||
                            firstClientId !== candidateClientId
                          )

                        const alreadyBilled = billings.some(
                          (billing) =>
                            billing.invoice_type === "service_fee" &&
                            billing.status !== "cancelled" &&
                            (
                              billing.engagement_ids?.includes(
                                engagement.id
                              ) ||
                              billing.engagement_id === engagement.id
                            )
                        )

                        const disabled =
                          alreadySelected ||
                          differentClient ||
                          alreadyBilled

                        return (
                          <button
                            key={engagement.id}
                            type="button"
                            disabled={disabled}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={() =>
                              handleSelectEngagement(engagement)
                            }
                          >
                            <Plus className="size-4 shrink-0" />

                            <span className="min-w-0 flex-1">
                              <span className="block font-medium">
                                {engagementLabel(engagement)}
                              </span>

                              {engagement.business?.businessName && (
                                <span className="block text-xs text-muted-foreground">
                                  {engagement.business.businessName}
                                </span>
                              )}

                              {alreadySelected && (
                                <span className="block text-xs text-muted-foreground">
                                  Already selected
                                </span>
                              )}

                              {differentClient && (
                                <span className="block text-xs text-muted-foreground">
                                  Belongs to a different client
                                </span>
                              )}

                              {alreadyBilled && !alreadySelected && (
                                <span className="block text-xs text-muted-foreground">
                                  Already billed
                                </span>
                              )}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                {engagementSearch &&
                  filteredEngagements.length === 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      No matching engagements found.
                    </p>
                  )}

                {selectedEngagements.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => engagementSearchRef.current?.focus()}
                  >
                    <Plus className="size-4" />
                    Add Engagement
                  </Button>
                )}

                {errors.engagement && (
                  <p className="text-xs text-red-500">
                    {typeof errors.engagement === "string"
                      ? errors.engagement
                      : duplicateServiceFee
                        ? "One or more selected engagements already have a Service Fee invoice."
                        : "Please select at least one engagement."}
                  </p>
                )}

                {engagementsUnavailable && (
                  <p className="text-xs text-muted-foreground">
                    No engagements are available.
                  </p>
                )}
              </Field>
            )}

            {/* RETAINER FEE: CLIENT */}
            {isRetainerFee && (
              <>
                <Field>
                  <FieldLabel>
                    Client <span className="text-red-500">*</span>
                  </FieldLabel>

                  {selectedClient ? (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                      <span>{clientLabel(selectedClient)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setClientId("")
                          setClientSearch("")
                        }}
                      >
                        Change
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                        <Input
                          value={clientSearch}
                          onChange={(event) =>
                            handleClientSearch(event.target.value)
                          }
                          placeholder="Search client..."
                          className="pl-9"
                          disabled={clientsUnavailable}
                        />
                      </div>

                      {clientSearch &&
                        filteredClients.length > 0 && (
                          <div className="mt-1 max-h-48 overflow-y-auto rounded-md border bg-background">
                            {filteredClients.map((client) => (
                              <button
                                key={client.id}
                                type="button"
                                className="flex w-full flex-col px-3 py-2 text-left text-sm hover:bg-muted"
                                onClick={() => handleSelectClient(client)}
                              >
                                <span className="font-medium">
                                  {clientLabel(client)}
                                </span>

                                {client.email && (
                                  <span className="text-xs text-muted-foreground">
                                    {client.email}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                      {clientSearch &&
                        filteredClients.length === 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No matching clients found.
                          </p>
                        )}
                    </>
                  )}

                  {errors.client && (
                    <p className="text-xs text-red-500">
                      Please select a client.
                    </p>
                  )}

                  {clientsUnavailable && (
                    <p className="text-xs text-muted-foreground">
                      No clients are available.
                    </p>
                  )}
                </Field>

                {/* RETAINER BILLING PERIOD */}
                <Field>
                  <FieldLabel>
                    Billing Period <span className="text-red-500">*</span>
                  </FieldLabel>

                  <div className="grid grid-cols-2 gap-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-between font-normal",
                            !billingMonth && "text-muted-foreground"
                          )}
                        >
                          {selectedMonthLabel || "Select month"}
                          <span className="text-xs opacity-60">▼</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent className="max-h-64 w-[220px] overflow-y-auto">
                        {MONTHS.map((month) => (
                          <DropdownMenuItem
                            key={month.value}
                            onClick={() =>
                              handleBillingMonthChange(month.value)
                            }
                          >
                            {month.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-between font-normal",
                            !billingYear && "text-muted-foreground"
                          )}
                        >
                          {billingYear || "Select year"}
                          <span className="text-xs opacity-60">▼</span>
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent>
                        {YEARS.map((year) => (
                          <DropdownMenuItem
                            key={year}
                            onClick={() =>
                              handleBillingYearChange(year)
                            }
                          >
                            {year}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Defaults to the current billing period. Change it if billing for a different period.
                  </p>

                  {errors.billingPeriod && (
                    <p className="text-xs text-red-500">
                      {duplicateRetainer
                        ? `A retainer fee already exists for this client for ${selectedBillingPeriod}.`
                        : "Please select a billing period."}
                    </p>
                  )}
                </Field>
              </>
            )}

            {/* AMOUNT */}
            <Field>
              <FieldLabel>
                Amount <span className="text-red-500">*</span>
              </FieldLabel>

              <Input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setErrors((previous) => ({
                    ...previous,
                    amount: false,
                  }))
                }}
                placeholder="0.00"
              />

              {errors.amount && (
                <p className="text-xs text-red-500">
                  Enter a valid amount greater than 0.
                </p>
              )}
            </Field>

            {/* DUE DATE */}
            <Field>
              <FieldLabel>
                Due Date <span className="text-red-500">*</span>
              </FieldLabel>

              <Input
                type="date"
                value={dueDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => {
                  setDueDate(event.target.value)
                  setErrors((previous) => ({
                    ...previous,
                    dueDate: false,
                  }))
                }}
              />

              {errors.dueDate && (
                <p className="text-xs text-red-500">
                  Due date must be today or a future date.
                </p>
              )}
            </Field>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange?.(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitDisabled}>
              {submitting ? "Creating..." : "Create Billing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2 } from "lucide-react"

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
import { useFetchUsers } from "@/hooks/useUsers"
import { useFetchServices } from "@/hooks/useServices"
import { useSearchClients } from "@/hooks/useBusinesses"
import { useFetchBusinessBillings } from "@/hooks/useBillings"
import { isOutstandingBill } from "@/lib/outstanding-bill"
import { scrollToFirstInvalidField } from "@/lib/form-validation"
import { getZodFieldErrors } from "@/lib/form-validation"
import { engagementSchema } from "@/schemas/engagementSchema"


const sectionHeadingClass = "font-heading text-sm font-medium text-foreground"
const getTodayDateInputValue = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function ReadOnlyRow({ label, children }) {
  return (
    <div className="grid min-w-0 grid-cols-[140px_minmax(0,1fr)] gap-4 py-2.5 text-sm">
      <dt className="min-w-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  )
}

export function CreateEngagementDialog({
  open = false,
  onOpenChange,
  request,
  onSubmit,
  submitting = false,
  error,
  className,
}) {
  const isStandalone = !request

  const [serviceId, setServiceId] = useState(() => request?.serviceId ?? "")
  const [assignedStaff, setAssignedStaff] = useState("")
  const [startDate, setStartDate] = useState("")
  const [targetEndDate, setTargetEndDate] = useState("")
  const [serviceFee, setServiceFee] = useState("")

  const [clientQuery, setClientQuery] = useState(() =>
    isStandalone ? "" : `${request?.client?.firstName ?? ""} ${request?.client?.lastName ?? ""}`.trim()
  )
  const [debouncedClientQuery, setDebouncedClientQuery] = useState("")
  const [selectedClientId, setSelectedClientId] = useState("")
  const [selectedBusinessId, setSelectedBusinessId] = useState("")
  const [clientFirstName, setClientFirstName] = useState(() => request?.client?.firstName ?? "")
  const [clientLastName, setClientLastName] = useState(() => request?.client?.lastName ?? "")
  const [businessName, setBusinessName] = useState(() => request?.business?.businessName ?? "")
  const [businessType, setBusinessType] = useState(() => request?.business?.businessType ?? "")
  const [contactNo, setContactNo] = useState(() => request?.client?.contactNo ?? "")
  const [clientEmail, setClientEmail] = useState(() => request?.client?.email ?? "")

  const [errors, setErrors] = useState({})
  const formRef = useRef(null)


  const { data: users = [] } = useFetchUsers()

  const {
    data: services = [],
    isLoading: servicesLoading,
    error: servicesError,
  } = useFetchServices({ enabled: isStandalone })

  const {
    data: matchingClients = [],
    isFetching: clientsLoading,
    error: clientsError,
  } = useSearchClients(debouncedClientQuery)

  const {
    data: clientBillings = [],
    isPending: clientBillingsLoading,
  } = useFetchBusinessBillings(isStandalone ? selectedBusinessId : "")
  const outstandingBillCount = clientBillings.filter(isOutstandingBill).length

  const offeredServices = services
    .filter((service) => {
      const category = service.category?.trim().toLowerCase()
      const isOfferedCategory = ["tax-filing", "business-registration"].includes(category)
      return service.status?.trim().toLowerCase() === "active" && isOfferedCategory
    })
    .filter(
      (service, index, offered) =>
        offered.findIndex(
          (candidate) =>
            candidate.name.trim().toLowerCase() === service.name.trim().toLowerCase()
        ) === index
    )
  const selectedService = request
    ? {
        id: request.serviceId,
        name: request.serviceName,
        basePrice: request.revenue ?? 0,
      }
    : offeredServices.find((service) => service.id === serviceId)

  const firmStaffOptions = users
    .filter((u) => u.role === "staff")
    .map((u) => ({ value: u.id, label: u.name }))

  const activeStaff = firmStaffOptions.find((s) => s.value === assignedStaff)
  const todayDate = getTodayDateInputValue()
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedClientQuery(clientQuery.trim())
    }, 250)
    return () => window.clearTimeout(timeoutId)
  }, [clientQuery])

  const handleServiceChange = (value) => {
    const service = offeredServices.find((item) => item.id === value)
    if (!service) return

    setServiceId(service.id)
    setServiceFee(String(service.basePrice ?? 0))
  }

  const clientFullName = isStandalone
    ? [clientFirstName, clientLastName].filter(Boolean).join(" ") || "—"
    : request?.client
      ? [request.client.firstName, request.client.lastName].filter(Boolean).join(" ")
      : "—"

  const handleSubmit = (event) => {
    event.preventDefault()

    const validationErrors = getZodFieldErrors(engagementSchema, {
      serviceName: selectedService ? selectedService.name : "",
      assignedStaff,
      startDate: startDate && startDate >= todayDate ? startDate : "",
      targetEndDate,
      standaloneClient: isStandalone ? selectedBusinessId : undefined,
    })
    const newErrors = {
      serviceName: Boolean(validationErrors.serviceName),
      assignedStaff: Boolean(validationErrors.assignedStaff),
      startDate: Boolean(validationErrors.startDate),
      targetEndDate: Boolean(validationErrors.targetEndDate),
      ...(isStandalone ? { client: !selectedBusinessId } : {}),
    }

    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) {
      scrollToFirstInvalidField(formRef.current)
      return
    }

    const client = isStandalone
      ? {
          id: selectedClientId,
          firstName: clientFirstName.trim(),
          lastName: clientLastName.trim(),
          contactNo: contactNo.trim(),
          email: clientEmail.trim(),
        }
      : request?.client

    const business = isStandalone
      ? {
          id: selectedBusinessId,
          businessName: businessName.trim(),
          businessType: businessType.trim(),
        }
      : request?.business

    onSubmit?.({
      requestNumber: request?.requestNumber ?? null,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      client,
      business,
      assignedStaff,
      startDate,
      targetEndDate,
      serviceFee: Number(selectedService?.basePrice ?? (serviceFee || 0)),
    })
  }

  const applyClientSuggestion = (client) => {
    setSelectedClientId(client.ownerId)
    setSelectedBusinessId(client.id)
    setClientQuery(`${client.firstName} ${client.lastName}`.trim())
    setClientFirstName(client.firstName ?? "")
    setClientLastName(client.lastName ?? "")
    setBusinessName(client.businessName ?? "")
    setBusinessType(client.businessType ?? "")
    setContactNo(client.contactNo ?? "")
    setClientEmail(client.email ?? "")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="create-engagement-dialog"
        className={cn("max-w-3xl", className)}
      >
        <DialogHeader>
          <DialogTitle>Create Engagement</DialogTitle>
          <DialogDescription>
            {isStandalone
              ? "Set up a new engagement for a client."
              : "Set up the engagement details for this approved request."}
          </DialogDescription>
        </DialogHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1"
        >
          <h3 className={sectionHeadingClass}>Engagement Information</h3>

          <FieldGroup>
            <Field>
              <FieldLabel>Service<span className="text-red-500">*</span></FieldLabel>
              {request ? (
                <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-sm text-foreground">
                  {selectedService?.name || "Requested service unavailable"}
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        aria-invalid={Boolean(errors.serviceName) || undefined}
                        className={cn(
                          "h-8 w-full justify-between rounded-lg px-2.5 font-normal",
                          errors.serviceName && "border-red-500 focus-visible:ring-red-500"
                        )}
                      />
                    }
                  >
                    {selectedService?.name || "Select service"}
                    <ChevronDown className="size-4 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-64">
                    {servicesLoading && (
                      <DropdownMenuItem disabled>Loading services...</DropdownMenuItem>
                    )}
                    {!servicesLoading && servicesError && (
                      <DropdownMenuItem disabled>Unable to load services</DropdownMenuItem>
                    )}
                    {!servicesLoading && !servicesError && offeredServices.length === 0 && (
                      <DropdownMenuItem disabled>
                        No active tax filing or business registration services available
                      </DropdownMenuItem>
                    )}
                    {!servicesLoading && !servicesError && offeredServices.map((service) => (
                      <DropdownMenuItem
                        key={service.id}
                        onClick={() => handleServiceChange(service.id)}
                      >
                        {service.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {errors.serviceName && <p className="text-sm text-red-500">Select a service.</p>}
            </Field>
          </FieldGroup>

          <h3 className={sectionHeadingClass}>Client Information</h3>

          {isStandalone ? (
            <FieldGroup>
              <Field>
                <FieldLabel>Client<span className="text-red-500">*</span></FieldLabel>
                <div className="relative">
                  <Input
                    value={clientQuery}
                    aria-invalid={Boolean(errors.client) || undefined}
                    onChange={(e) => {
                      setClientQuery(e.target.value)
                      setSelectedClientId("")
                      setSelectedBusinessId("")
                      setClientFirstName("")
                      setClientLastName("")
                      setBusinessName("")
                      setBusinessType("")
                      setContactNo("")
                      setClientEmail("")
                      setErrors((previous) => ({ ...previous, client: false }))
                    }}
                    placeholder="Search existing client"
                    disabled={submitting}
                    className={cn(
                      "pr-10",
                      errors.client && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {clientQuery.trim().length >= 2 && (clientsLoading || clientsError || matchingClients.length > 0) && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-sm">
                      {clientsLoading && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Searching clients...</p>
                      )}
                      {!clientsLoading && clientsError && (
                        <p className="px-3 py-2 text-sm text-destructive">Unable to search clients.</p>
                      )}
                      {!clientsLoading && !clientsError && matchingClients.length === 0 && (
                        <p className="px-3 py-2 text-sm text-muted-foreground">No matching clients.</p>
                      )}
                      {!clientsLoading && !clientsError && matchingClients.slice(0, 5).map((client) => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => applyClientSuggestion(client)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                        >
                          <span className="font-medium text-foreground">
                            {client.firstName} {client.lastName}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {client.businessName}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.client && (
                  <p className="text-sm text-red-500">
                    Select a client from the search results.
                  </p>
                )}
              </Field>

              {selectedBusinessId && (
                <div
                  role={outstandingBillCount > 0 ? "alert" : "status"}
                  className={cn(
                    "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
                    clientBillingsLoading
                      ? "border-border bg-muted/40 text-muted-foreground"
                      : outstandingBillCount > 0
                        ? "border-amber-300/70 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
                        : "border-emerald-300/70 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200"
                  )}
                >
                  {clientBillingsLoading ? (
                    <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin" />
                  ) : outstandingBillCount > 0 ? (
                    <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  ) : (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                  )}
                  <div className="min-w-0 space-y-0.5">
                    {clientBillingsLoading ? (
                      <p className="font-medium">Checking unpaid bills…</p>
                    ) : outstandingBillCount > 0 ? (
                      <>
                        <p className="font-medium">
                          {outstandingBillCount} unpaid{" "}
                          {outstandingBillCount === 1 ? "bill" : "bills"}
                        </p>
                        <p>
                          This client has an outstanding balance. Settle{" "}
                          {outstandingBillCount === 1 ? "it" : "them"} before creating a new
                          engagement.
                        </p>
                      </>
                    ) : (
                      <p className="font-medium">
                        0 unpaid bills — this client is clear for a new engagement.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>First Name<span className="text-red-500">*</span></FieldLabel>
                  <Input
                    value={clientFirstName}
                    placeholder="Juan"
                    readOnly
                    aria-readonly="true"
                    className={cn(errors.clientFirstName && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.clientFirstName && <p className="text-sm text-red-500">First name is required.</p>}
                </Field>
                <Field>
                  <FieldLabel>Last Name<span className="text-red-500">*</span></FieldLabel>
                  <Input
                    value={clientLastName}
                    placeholder="Dela Cruz"
                    readOnly
                    aria-readonly="true"
                    className={cn(errors.clientLastName && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.clientLastName && <p className="text-sm text-red-500">Last name is required.</p>}
                </Field>
              </div>
              <Field>
                <FieldLabel>Business Name<span className="text-red-500">*</span></FieldLabel>
                <Input
                  value={businessName}
                  placeholder="Business name"
                  readOnly
                  aria-readonly="true"
                  className={cn(errors.businessName && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.businessName && <p className="text-sm text-red-500">Business name is required.</p>}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Business Type</FieldLabel>
                  <Input
                    value={businessType}
                    placeholder="Sole Proprietorship"
                    readOnly
                    aria-readonly="true"
                  />
                </Field>
                <Field>
                  <FieldLabel>Contact Number</FieldLabel>
                  <Input
                    value={contactNo}
                    placeholder="0917 123 4567"
                    readOnly
                    aria-readonly="true"
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={clientEmail}
                  placeholder="client@example.com"
                  readOnly
                  aria-readonly="true"
                />
              </Field>
            </FieldGroup>
          ) : (
            <div className="rounded-xl border border-border bg-muted/30 px-6">
              <dl className="divide-y divide-border/60">
                <ReadOnlyRow label="Client Name">{clientFullName}</ReadOnlyRow>
                <ReadOnlyRow label="Business Name">
                  {request?.business?.businessName ?? "—"}
                </ReadOnlyRow>
                <ReadOnlyRow label="Business Type">
                  {request?.business?.businessType ?? "—"}
                </ReadOnlyRow>
                <ReadOnlyRow label="Contact Number">
                  {request?.client?.contactNo ?? "—"}
                </ReadOnlyRow>
                <ReadOnlyRow label="Email">
                  {request?.client?.email ?? "—"}
                </ReadOnlyRow>
              </dl>
            </div>
          )}

          <h3 className={sectionHeadingClass}>Assignment</h3>

          <FieldGroup>
            <Field>
              <FieldLabel>Assigned Lead<span className="text-red-500">*</span></FieldLabel>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      className={cn(
                        "h-8 w-full justify-between rounded-lg px-2.5 font-normal",
                        errors.assignedStaff && "border-red-500 focus-visible:ring-red-500"
                      )}
                        aria-invalid={Boolean(errors.assignedStaff) || undefined}
                    />
                  }
                >
                  {activeStaff?.label ?? "Select Staff"}
                  <ChevronDown className="size-4 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-56">
                  {firmStaffOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => setAssignedStaff(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.assignedStaff && (
                <p className="text-sm text-red-500">Assign a firm staff member.</p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="start-date">
                  Start Date<span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  min={todayDate}
                  onChange={(e) => {
                    setStartDate(e.target.value)
                    setErrors((previous) => ({
                      ...previous,
                      startDate: !e.target.value || e.target.value < todayDate,
                    }))
                  }}
                  disabled={submitting}
                  className={cn(errors.startDate && "border-red-500 focus-visible:ring-red-500")}
                  aria-invalid={Boolean(errors.startDate) || undefined}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">
                    Choose today or a future date.
                  </p>
                )}
              </Field>

              <Field>
                <FieldLabel htmlFor="target-end-date">
                  Target Completion Date<span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="target-end-date"
                  type="date"
                  value={targetEndDate}
                  onChange={(e) => setTargetEndDate(e.target.value)}
                  disabled={submitting}
                  min={startDate || todayDate}
                  className={cn(errors.targetEndDate && "border-red-500 focus-visible:ring-red-500")}
                  aria-invalid={Boolean(errors.targetEndDate) || undefined}
                />
                {errors.targetEndDate && (
                  <p className="text-sm text-red-500">Target completion date is required.</p>
                )}
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
              disabled={submitting}
              className="bg-[#02353C] text-white hover:opacity-90"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Creating…" : "Create Engagement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useMemo, useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

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
import { registeredClients } from "../engagements/engagement-variants"
import { useFetchUsers } from "@/hooks/useUsers"
import { useFetchServices } from "@/hooks/useServices"


const sectionHeadingClass = "font-heading text-sm font-medium text-foreground"

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

  const [serviceName, setServiceName] = useState(() => request?.serviceName ?? "")
  const [assignedStaff, setAssignedStaff] = useState("")
  const [startDate, setStartDate] = useState("")
  const [targetEndDate, setTargetEndDate] = useState("")
  const [serviceFee, setServiceFee] = useState("")

  const [clientQuery, setClientQuery] = useState(() =>
    isStandalone ? "" : `${request?.client?.firstName ?? ""} ${request?.client?.lastName ?? ""}`.trim()
  )
  const [clientFirstName, setClientFirstName] = useState(() => request?.client?.firstName ?? "")
  const [clientLastName, setClientLastName] = useState(() => request?.client?.lastName ?? "")
  const [businessName, setBusinessName] = useState(() => request?.business?.businessName ?? "")
  const [businessType, setBusinessType] = useState(() => request?.business?.businessType ?? "")
  const [contactNo, setContactNo] = useState(() => request?.client?.contactNo ?? "")
  const [clientEmail, setClientEmail] = useState(() => request?.client?.email ?? "")
  const [clientDescription, setClientDescription] = useState(() => request?.clientDescription ?? request?.notes ?? "")

  const [errors, setErrors] = useState({})


  const { data: users = [] } = useFetchUsers()
  const {
    data: services = [],
    isLoading: servicesLoading,
    error: servicesError,
  } = useFetchServices()
  const activeServices = services.filter((service) => service.status === "active")
  const selectedService = services.find((service) => service.name === serviceName)

  const firmStaffOptions = users
    .filter((u) => u.role === "staff")
    .map((u) => ({ value: u.id, label: u.name }))

  const activeStaff = firmStaffOptions.find((s) => s.value === assignedStaff)
  const matchingClients = useMemo(() => {
    const query = clientQuery.trim().toLowerCase()
    if (!query) return registeredClients.slice(0, 5)
    return registeredClients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase()
      const businessName = (client.businessName ?? "").toLowerCase()
      return fullName.includes(query) || businessName.includes(query)
    })
  }, [clientQuery])

  const handleServiceChange = (value) => {
    const service = activeServices.find((item) => item.id === value)
    if (!service) return

    setServiceName(service.name)
    setServiceFee(String(service.basePrice ?? 0))
  }

  const clientFullName = isStandalone
    ? [clientFirstName, clientLastName].filter(Boolean).join(" ") || "—"
    : request?.client
      ? [request.client.firstName, request.client.lastName].filter(Boolean).join(" ")
      : "—"

  const handleSubmit = (event) => {
    event.preventDefault()

    const newErrors = {
      serviceName: !serviceName.trim(),
      assignedStaff: !assignedStaff,
      startDate: !startDate,
      targetEndDate: !targetEndDate,
    }

    if (isStandalone) {
      newErrors.clientFirstName = !clientFirstName.trim()
      newErrors.clientLastName = !clientLastName.trim()
      newErrors.businessName = !businessName.trim()
    }

    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    const client = isStandalone
      ? {
          firstName: clientFirstName.trim(),
          lastName: clientLastName.trim(),
          contactNo: contactNo.trim(),
          email: clientEmail.trim(),
          description: clientDescription.trim(),
        }
      : request?.client

    const business = isStandalone
      ? { businessName: businessName.trim(), businessType: businessType.trim() }
      : request?.business

    onSubmit?.({
      requestNumber: request?.requestNumber ?? null,
      serviceName,
      client,
      business,
      assignedStaff,
      startDate,
      targetEndDate,
      serviceFee: Number(selectedService?.basePrice ?? (serviceFee || 0)),
      clientDescription: clientDescription.trim(),
    })
  }

  const applyClientSuggestion = (client) => {
    setClientQuery(`${client.firstName} ${client.lastName}`.trim())
    setClientFirstName(client.firstName)
    setClientLastName(client.lastName)
    setBusinessName(client.businessName ?? "")
    setBusinessType(client.businessType ?? "")
    setContactNo(client.contactNo ?? "")
    setClientEmail(client.email ?? "")
    setClientDescription(client.description ?? "")
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
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh] p-1"
        >
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#02353C]/10 text-[#02353C]">
              <span className="text-xs font-bold">1</span>
            </div>
            <div className="flex flex-col">
              <h3 className={sectionHeadingClass}>Engagement Information</h3>
            </div>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Service<span className="text-red-500">*</span></FieldLabel>
              
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      className={cn(
                        "h-8 w-full justify-between rounded-lg px-2.5 font-normal",
                        errors.serviceName && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  }
                >
                  {serviceName || "Select service"}
                  <ChevronDown className="size-4 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-64">
                  {servicesLoading && (
                    <DropdownMenuItem disabled>Loading services...</DropdownMenuItem>
                  )}
                  {!servicesLoading && servicesError && (
                    <DropdownMenuItem disabled>Unable to load services</DropdownMenuItem>
                  )}
                  {!servicesLoading && !servicesError && activeServices.length === 0 && (
                    <DropdownMenuItem disabled>No active services available</DropdownMenuItem>
                  )}
                  {!servicesLoading && !servicesError && activeServices.map((service) => (
                    <DropdownMenuItem
                      key={service.id}
                      onClick={() => handleServiceChange(service.id)}
                    >
                      {service.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.serviceName && <p className="text-sm text-red-500">Select a service.</p>}
            </Field>
          </FieldGroup>

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#02353C]/10 text-[#02353C]">
              <span className="text-xs font-bold">2</span>
            </div>
            <div className="flex flex-col">
              <h3 className={sectionHeadingClass}>Client Information</h3>
            </div>
          </div>

          {isStandalone ? (
            <FieldGroup>
              <Field>
                <FieldLabel>Client<span className="text-red-500">*</span></FieldLabel>
                <div className="relative">
                  <Input
                    value={clientQuery}
                    onChange={(e) => setClientQuery(e.target.value)}
                    placeholder="Search existing client"
                    disabled={submitting}
                    className={cn(
                      "pr-10",
                      errors.clientFirstName && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  {clientQuery && matchingClients.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-sm">
                      {matchingClients.slice(0, 5).map((client) => (
                        <button
                          key={`${client.firstName}-${client.lastName}`}
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
                {(errors.clientFirstName || errors.clientLastName) && (
                  <p className="text-sm text-red-500">Client is required.</p>
                )}
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>First Name<span className="text-red-500">*</span></FieldLabel>
                  <Input
                    value={clientFirstName}
                    onChange={(e) => setClientFirstName(e.target.value)}
                    placeholder="Juan"
                    disabled={submitting}
                    className={cn(errors.clientFirstName && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.clientFirstName && <p className="text-sm text-red-500">First name is required.</p>}
                </Field>
                <Field>
                  <FieldLabel>Last Name<span className="text-red-500">*</span></FieldLabel>
                  <Input
                    value={clientLastName}
                    onChange={(e) => setClientLastName(e.target.value)}
                    placeholder="Dela Cruz"
                    disabled={submitting}
                    className={cn(errors.clientLastName && "border-red-500 focus-visible:ring-red-500")}
                  />
                  {errors.clientLastName && <p className="text-sm text-red-500">Last name is required.</p>}
                </Field>
              </div>
              <Field>
                <FieldLabel>Business Name<span className="text-red-500">*</span></FieldLabel>
                <Input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Business name"
                  disabled={submitting}
                  className={cn(errors.businessName && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.businessName && <p className="text-sm text-red-500">Business name is required.</p>}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel>Business Type</FieldLabel>
                  <Input
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    placeholder="Sole Proprietorship"
                    disabled={submitting}
                  />
                </Field>
                <Field>
                  <FieldLabel>Contact Number</FieldLabel>
                  <Input
                    value={contactNo}
                    onChange={(e) => setContactNo(e.target.value)}
                    placeholder="0917 123 4567"
                    disabled={submitting}
                  />
                </Field>
              </div>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@example.com"
                  disabled={submitting}
                />
              </Field>
              <Field>
                <FieldLabel>Client Description</FieldLabel>
                <textarea
                  value={clientDescription}
                  onChange={(e) => setClientDescription(e.target.value)}
                  placeholder="Brief description of the client request or engagement context"
                  disabled={submitting}
                  rows={3}
                  className="min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
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

          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center rounded-lg bg-[#02353C]/10 text-[#02353C]">
              <span className="text-xs font-bold">3</span>
            </div>
            <div className="flex flex-col">
              <h3 className={sectionHeadingClass}>Assignment</h3>
            </div>
          </div>

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
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={submitting}
                  className={cn(errors.startDate && "border-red-500 focus-visible:ring-red-500")}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-500">Start date is required.</p>
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
                  min={startDate || undefined}
                  className={cn(errors.targetEndDate && "border-red-500 focus-visible:ring-red-500")}
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

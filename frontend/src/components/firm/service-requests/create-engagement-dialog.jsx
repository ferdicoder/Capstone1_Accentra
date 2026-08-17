import { useState } from "react"
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
import {
  serviceTemplateCatalog,
  getServiceTemplatePrice,
} from "../service-management/service-management-variants"

/**
 * Mock firm staff list — Admin and Staff only.
 * In a real app this would come from the firm users API.
 */
const firmStaffOptions = [
  { value: "staff-001", label: "Maria Clara Santos" },
  { value: "staff-002", label: "Juan Dela Cruz" },
  { value: "staff-003", label: "Ana Reyes" },
  { value: "staff-004", label: "Carlos Mendoza" },
]

const sectionHeadingClass = "font-heading text-sm font-medium text-foreground"

/**
 * Read-only display row used for the Client Information section.
 */
function ReadOnlyRow({ label, children }) {
  return (
    <div className="grid min-w-0 grid-cols-[140px_minmax(0,1fr)] gap-4 py-2.5 text-sm">
      <dt className="min-w-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  )
}

/**
 * Floating "Create Engagement" dialog. Opens on top of the Review Request
 * modal (which closes first). The engagement form is pre-filled from the
 * approved request and the selected service template.
 *
 * @param {boolean}  open          – Whether the dialog is visible.
 * @param {Function} onOpenChange  – (open: boolean) => void.
 * @param {Object}   request       – The approved service request record.
 * @param {Function} onSubmit      – (values) => void.
 * @param {boolean}  submitting    – Disables the form and shows spinner.
 * @param {string}   error         – Optional error message from parent.
 */
export function CreateEngagementDialog({
  open = false,
  onOpenChange,
  request,
  onSubmit,
  submitting = false,
  error,
  className,
}) {
  // --- Section 1: Engagement Information ---
  const defaultTitle = request
    ? `${request.serviceName} — ${request.business?.businessName ?? ""}`
    : ""

  const [serviceName, setServiceName] = useState(() => request?.serviceName ?? "")

  // --- Section 3: Assignment ---
  const [assignedStaff, setAssignedStaff] = useState("")
  const [startDate, setStartDate] = useState("")
  const [targetEndDate, setTargetEndDate] = useState("")

  // --- Section 4: Pricing ---
  const [serviceFee, setServiceFee] = useState(() =>
    request?.serviceName ? String(getServiceTemplatePrice(request.serviceName)) : ""
  )

  const [errors, setErrors] = useState({})

  const activeStaff = firmStaffOptions.find((s) => s.value === assignedStaff)

  // When service changes, auto-fill the fee from the catalog.
  const handleServiceChange = (value) => {
    setServiceName(value)
    setServiceFee(String(getServiceTemplatePrice(value)))
  }

  // --- Derived read-only client info ---
  const clientFullName = request?.client
    ? [request.client.firstName, request.client.lastName].filter(Boolean).join(" ")
    : "—"

  const handleSubmit = (event) => {
    event.preventDefault()

    const newErrors = {
      serviceName: !serviceName.trim(),
      assignedStaff: !assignedStaff,
      startDate: !startDate,
      targetEndDate: !targetEndDate,
      serviceFee: !serviceFee || Number(serviceFee) < 0,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    onSubmit?.({
      requestNumber: request?.requestNumber,
      serviceName,
      client: request?.client,
      business: request?.business,
      assignedStaff,
      startDate,
      targetEndDate,
      serviceFee: Number(serviceFee),
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-slot="create-engagement-dialog"
        className={cn("max-w-2xl", className)}
      >
        <DialogHeader>
          <DialogTitle>Create Engagement</DialogTitle>
          <DialogDescription>
            Set up the engagement details for this approved request.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-5 overflow-y-auto max-h-[70vh]"
        >
          {/* ── SECTION 1: ENGAGEMENT INFORMATION ── */}
          <div className="flex flex-col gap-1">
            <h3 className={sectionHeadingClass}>Engagement Information</h3>
            <p className="text-sm text-muted-foreground">
              Core details about this engagement.
            </p>
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
                  {serviceTemplateCatalog.map((template) => (
                    <DropdownMenuItem
                      key={template.name}
                      onClick={() => handleServiceChange(template.name)}
                    >
                      {template.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.serviceName && <p className="text-sm text-red-500">Select a service.</p>}
            </Field>

          </FieldGroup>

          {/* ── SECTION 2: CLIENT INFORMATION (read-only) ── */}
          <div className="flex flex-col gap-1">
            <h3 className={sectionHeadingClass}>Client Information</h3>
            <p className="text-sm text-muted-foreground">
              Read-only — pulled from the approved request.
            </p>
          </div>

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

          {/* ── SECTION 3: ASSIGNMENT ── */}
          <div className="flex flex-col gap-1">
            <h3 className={sectionHeadingClass}>Assignment</h3>
            <p className="text-sm text-muted-foreground">
              Assign a firm staff member and set the timeline.
            </p>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel>Assigned Firm Staff<span className="text-red-500">*</span></FieldLabel>
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
                  {activeStaff?.label ?? "Select staff member"}
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

          {/* ── SECTION 4: PRICING ── */}
          <div className="flex flex-col gap-1">
            <h3 className={sectionHeadingClass}>Pricing</h3>
            <p className="text-sm text-muted-foreground">
              Auto-populated from the service template. Edit if needed.
            </p>
          </div>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="service-fee">
                Service Fee (₱)<span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="service-fee"
                type="number"
                min="0"
                step="0.01"
                value={serviceFee}
                onChange={(e) => setServiceFee(e.target.value)}
                placeholder="2500"
                disabled={submitting}
                className={cn(errors.serviceFee && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.serviceFee && (
                <p className="text-sm text-red-500">Enter a valid service fee.</p>
              )}
            </Field>
          </FieldGroup>

          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}

          {/* ── FOOTER ── */}
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

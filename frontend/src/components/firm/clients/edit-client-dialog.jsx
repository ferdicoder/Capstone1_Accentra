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

import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  DEFAULT_CLIENT_TYPE,
  businessTypeOptions,
  clientTypeOptions,
  industryOptions,
} from "./client-variants"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Accepts 09XXXXXXXXX or +639XXXXXXXXX (digits, spaces, dashes allowed). */
const PHONE_PATTERN = /^\+?[0-9\s-]{10,14}$/

const errorClass = "border-red-500 focus-visible:ring-red-500"

/**
 * Dropdown field matching the Role selector in the Edit User dialog. If the
 * stored value isn't one of `options` (legacy/free-text data) it is kept as an
 * extra choice instead of being silently dropped.
 */
function DropdownField({ id, label, value, options, placeholder, onChange }) {
  const hasUnknownValue = Boolean(value) && !options.some((option) => option.value === value)
  const allOptions = hasUnknownValue ? [...options, { value, label: value }] : options
  const active = allOptions.find((option) => option.value === value)

  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="h-8 w-full justify-between rounded-lg px-2.5 font-normal"
            />
          }
        >
          <span className={cn("truncate", !active && "text-muted-foreground")}>
            {active?.label ?? placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-40">
          {allOptions.map((option) => (
            <DropdownMenuItem key={option.value} onClick={() => onChange(option.value)}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </Field>
  )
}

/**
 * Inner form. Lives inside <DialogContent>, so it mounts fresh every time the
 * dialog opens and the pre-filled values always come from the current `client`.
 */
function EditClientForm({ client, onSubmit, onDeactivate, onCancel, submitLabel, cancelLabel }) {
  const [values, setValues] = useState(() => ({
    clientType: client?.clientType ?? DEFAULT_CLIENT_TYPE,
    firstName: client?.firstName ?? "",
    middleName: client?.middleName ?? "",
    lastName: client?.lastName ?? "",
    email: client?.email ?? "",
    contactNo: client?.contactNo ?? "",
    businessName: client?.businessName ?? "",
    businessType: client?.businessType ?? "",
    industry: client?.industry ?? "",
    tinNo: client?.tinNo ?? "",
    address: client?.address ?? "",
  }))
  const [errors, setErrors] = useState({})

  const setField = (field) => (event) =>
    setValues((current) => ({ ...current, [field]: event.target.value }))

  const setDropdown = (field) => (value) =>
    setValues((current) => ({ ...current, [field]: value }))

  const isDeactivated = client?.status === "deactivated"

  const handleSubmit = (event) => {
    event.preventDefault()

    const newErrors = {
      firstName: !values.firstName.trim(),
      lastName: !values.lastName.trim(),
      email: !values.email.trim() || !EMAIL_PATTERN.test(values.email.trim()),
      // Contact number is optional for clients without one on file, but must be valid if present.
      contactNo: Boolean(values.contactNo.trim()) && !PHONE_PATTERN.test(values.contactNo.trim()),
      businessName: !values.businessName.trim(),
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    onSubmit?.(
      Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value.trim()]))
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto">
      <FieldGroup>
        <DropdownField
          id="client-type"
          label="Type"
          value={values.clientType}
          options={clientTypeOptions}
          placeholder="Select type"
          onChange={setDropdown("clientType")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="client-first-name">
              First name<span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="client-first-name"
              value={values.firstName}
              onChange={setField("firstName")}
              className={cn(errors.firstName && errorClass)}
            />
            {errors.firstName && <p className="text-sm text-red-500">First name is required.</p>}
          </Field>

          <Field>
            <FieldLabel htmlFor="client-last-name">
              Last name<span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="client-last-name"
              value={values.lastName}
              onChange={setField("lastName")}
              className={cn(errors.lastName && errorClass)}
            />
            {errors.lastName && <p className="text-sm text-red-500">Last name is required.</p>}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="client-middle-name">Middle name</FieldLabel>
          <Input
            id="client-middle-name"
            value={values.middleName}
            onChange={setField("middleName")}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="client-email">
              Email<span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="client-email"
              type="email"
              value={values.email}
              onChange={setField("email")}
              className={cn(errors.email && errorClass)}
            />
            {errors.email && <p className="text-sm text-red-500">Enter a valid email address.</p>}
          </Field>

          <Field>
            <FieldLabel htmlFor="client-contact-number">Contact number</FieldLabel>
            <Input
              id="client-contact-number"
              type="tel"
              value={values.contactNo}
              onChange={setField("contactNo")}
              placeholder="0917 123 4567"
              className={cn(errors.contactNo && errorClass)}
            />
            {errors.contactNo && (
              <p className="text-sm text-red-500">Enter a valid contact number.</p>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="client-business-name">
            Business name<span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="client-business-name"
            value={values.businessName}
            onChange={setField("businessName")}
            className={cn(errors.businessName && errorClass)}
          />
          {errors.businessName && (
            <p className="text-sm text-red-500">Business name is required.</p>
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <DropdownField
            id="client-business-type"
            label="Business type"
            value={values.businessType}
            options={businessTypeOptions}
            placeholder="Select business type"
            onChange={setDropdown("businessType")}
          />

          <DropdownField
            id="client-industry"
            label="Industry"
            value={values.industry}
            options={industryOptions}
            placeholder="Select industry"
            onChange={setDropdown("industry")}
          />
        </div>

        <Field>
          <FieldLabel htmlFor="client-tin">TIN / UEN</FieldLabel>
          <Input id="client-tin" value={values.tinNo} onChange={setField("tinNo")} />
        </Field>

        <Field>
          <FieldLabel htmlFor="client-address">Address</FieldLabel>
          <Input id="client-address" value={values.address} onChange={setField("address")} />
        </Field>
      </FieldGroup>

      <DialogFooter className="flex-row justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          {cancelLabel}
        </Button>
        {onDeactivate && (
          <Button
            type="button"
            variant={isDeactivated ? "outline" : "destructive"}
            onClick={onDeactivate}
          >
            {isDeactivated ? "Reactivate" : "Deactivate"}
          </Button>
        )}
        <Button type="submit" className="bg-forest-900 text-white hover:opacity-90">
          {submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Presentational "Edit Client" modal for the Firm Admin. Mirrors
 * FirmUserEditDialog's layout and conventions. Fully controlled: the parent
 * owns `open`/`onOpenChange` and stores the values passed to `onSubmit`
 * (frontend/local state only). System-controlled fields (id, status) are
 * intentionally not editable.
 *
 * @param {boolean} open - Whether the dialog is visible.
 * @param {Function} onOpenChange - (open: boolean) => void.
 * @param {Object} client - The client record being edited (pre-fills the form).
 * @param {Function} onSubmit - (values) => void with validated, trimmed values.
 * @param {Function} onDeactivate - Optional () => void. Renders a Deactivate
 *   (or Reactivate, when already deactivated) button beside Save Changes.
 */
export function EditClientDialog({
  open = false,
  onOpenChange,
  onSubmit,
  onDeactivate,
  client,
  title = "Edit Client",
  description = "Update the client's contact and business information.",
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  className,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="edit-client-dialog" className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <EditClientForm
          client={client}
          onSubmit={onSubmit}
          onDeactivate={onDeactivate}
          onCancel={() => onOpenChange?.(false)}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
        />
      </DialogContent>
    </Dialog>
  )
}

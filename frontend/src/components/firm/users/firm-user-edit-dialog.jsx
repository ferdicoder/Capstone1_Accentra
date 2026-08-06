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
import { roleFilterOptions } from "./firm-user-variants"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Accepts 09XXXXXXXXX or +639XXXXXXXXX (digits, spaces, dashes allowed). */
const PHONE_PATTERN = /^\+?[0-9\s-]{10,14}$/

/** Reads the first non-empty string from a list of candidate keys on `user`. */
const getField = (user, ...keys) => {
  if (!user) return ""
  for (const key of keys) {
    const value = user[key]
    if (typeof value === "string" && value.trim()) return value
  }
  return ""
}

/**
 * Inner form for the Edit User dialog. Lives inside <DialogContent>, so it
 * mounts fresh every time the dialog opens and its state resets automatically
 * — the pre-filled values always come from the current `user` prop.
 */
function EditUserForm({
  user,
  onSubmit,
  submitting,
  error,
  roleOptions,
  onCancel,
  submitLabel,
  cancelLabel,
}) {
  const [firstName, setFirstName] = useState(() =>
    getField(user, "firstName", "first_name")
  )
  const [middleName, setMiddleName] = useState(() =>
    getField(user, "middleName", "middle_name")
  )
  const [lastName, setLastName] = useState(() =>
    getField(user, "lastName", "last_name")
  )
  const [extension, setExtension] = useState(() => getField(user, "extension"))
  const [email, setEmail] = useState(() => getField(user, "email"))
  const [contactNumber, setContactNumber] = useState(() =>
    getField(user, "contactNumber", "contact_number")
  )
  const [role, setRole] = useState(() => user?.role ?? "")
  const [errors, setErrors] = useState({})

  const activeRole = roleOptions.find((option) => option.value === role)

  const handleSubmit = (event) => {
    event.preventDefault()

    const newErrors = {
      firstName: !firstName.trim(),
      lastName: !lastName.trim(),
      email: !email.trim() || !EMAIL_PATTERN.test(email.trim()),
      contactNumber:
        !contactNumber.trim() || !PHONE_PATTERN.test(contactNumber.trim()),
      role: !role,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    onSubmit?.({
      id: user?.id,
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      extension: extension.trim(),
      email: email.trim(),
      contactNumber: contactNumber.trim(),
      role,
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-5 overflow-y-auto"
    >
      <FieldGroup>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firm-user-first-name">
              First name<span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="firm-user-first-name"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Juan"
              disabled={submitting}
              className={cn(errors.firstName && "border-red-500 focus-visible:ring-red-500")}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500">First name is required.</p>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="firm-user-last-name">
              Last name<span className="text-red-500">*</span>
            </FieldLabel>
            <Input
              id="firm-user-last-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Dela Cruz"
              disabled={submitting}
              className={cn(errors.lastName && "border-red-500 focus-visible:ring-red-500")}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500">Last name is required.</p>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="firm-user-middle-name">Middle name</FieldLabel>
            <Input
              id="firm-user-middle-name"
              value={middleName}
              onChange={(event) => setMiddleName(event.target.value)}
              placeholder="Santos"
              disabled={submitting}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="firm-user-extension">Extension</FieldLabel>
            <Input
              id="firm-user-extension"
              value={extension}
              onChange={(event) => setExtension(event.target.value)}
              placeholder="Jr., Sr., III"
              disabled={submitting}
            />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="firm-user-email">
            Email<span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="firm-user-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="juan@example.com"
            disabled={submitting}
            className={cn(errors.email && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.email && (
            <p className="text-sm text-red-500">Enter a valid email address.</p>
          )}
        </Field>

        <Field>
          <FieldLabel htmlFor="firm-user-contact-number">
            Contact number<span className="text-red-500">*</span>
          </FieldLabel>
          <Input
            id="firm-user-contact-number"
            type="tel"
            value={contactNumber}
            onChange={(event) => setContactNumber(event.target.value)}
            placeholder="0917 123 4567"
            disabled={submitting}
            className={cn(errors.contactNumber && "border-red-500 focus-visible:ring-red-500")}
          />
          {errors.contactNumber && (
            <p className="text-sm text-red-500">Enter a valid contact number.</p>
          )}
        </Field>

        <Field>
          <FieldLabel>Role<span className="text-red-500">*</span></FieldLabel>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  className={cn(
                    "h-8 w-full justify-between rounded-lg px-2.5 font-normal",
                    errors.role && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
              }
            >
              {activeRole?.label ?? "Select role"}
              <ChevronDown className="size-4 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-40">
              {roleOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setRole(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {errors.role && <p className="text-sm text-red-500">Select a role.</p>}
        </Field>
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
          onClick={onCancel}
        >
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-forest-900 text-white hover:opacity-90"
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {submitting ? `${submitLabel}…` : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  )
}

/**
 * Presentational "Edit User" modal form for the firm user list.
 * Fully controlled: the parent owns `open`/`onOpenChange` and performs any
 * API work after receiving the values from `onSubmit`. No API/auth/routing.
 *
 * The form is pre-filled with the user's current information every time the
 * dialog opens and resets on close. Mirrors FirmUserCreateDialog so both
 * modals share the exact same layout, radius, and spacing conventions.
 *
 * Status is intentionally NOT editable here — it is derived from system
 * activity (active / inactive / deactivated), never manually assigned.
 *
 * @param {boolean} open - Whether the dialog is visible.
 * @param {Function} onOpenChange - (open: boolean) => void.
 * @param {Object} user - The user record being edited. Used to pre-fill
 *   firstName/middleName/lastName/extension/email/contactNumber/role
 *   (snake_case variants like first_name are also accepted).
 * @param {Function} onSubmit - (values: { id, firstName, middleName, lastName,
 *   extension, email, contactNumber, role }) => void. Values are validated
 *   before being passed up; parent does the actual request.
 * @param {Array} roleOptions - [{ value, label }] for the role selector.
 *   Defaults to `roleFilterOptions` from "./firm-user-variants".
 * @param {boolean} submitting - Disables the form and shows a spinner on submit.
 * @param {string} error - Optional message from the parent (e.g. failed request).
 * @param {string} title - Dialog title. Default "Edit User".
 * @param {string} description - Helper text under the title.
 * @param {string} submitLabel - Submit button label. Default "Save Changes".
 * @param {string} cancelLabel - Cancel button label. Default "Cancel".
 * @param {string} className - Extra classes merged onto the dialog content.
 */
export function FirmUserEditDialog({
  open = false,
  onOpenChange,
  onSubmit,
  user,
  roleOptions = roleFilterOptions,
  submitting = false,
  error,
  title = "Edit User",
  description = "Update the user's information and role.",
  submitLabel = "Save Changes",
  cancelLabel = "Cancel",
  className,
  ...props
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="firm-user-edit-dialog" className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <EditUserForm
          user={user}
          onSubmit={onSubmit}
          submitting={submitting}
          error={error}
          roleOptions={roleOptions}
          onCancel={() => onOpenChange?.(false)}
          submitLabel={submitLabel}
          cancelLabel={cancelLabel}
        />
      </DialogContent>
    </Dialog>
  )
}

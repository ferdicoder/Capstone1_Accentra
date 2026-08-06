import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldDescription,
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

/**
 * Presentational "Add User" modal form for the firm user list.
 * Fully controlled: the parent owns `open`/`onOpenChange` and performs any
 * API work after receiving the values from `onSubmit`. No API/auth/routing.
 *
 * The firm admin creates the account on behalf of the new firm user/staff,
 * so the form includes a temporary password that the new user can change
 * after their first sign-in.
 *
 * @param {boolean} open - Whether the dialog is visible.
 * @param {Function} onOpenChange - (open: boolean) => void.
 * @param {Function} onSubmit - (values: { firstName, middleName, lastName,
 *   extension, email, contactNumber, temporaryPassword, role }) => void.
 *   Values are validated before being passed up; parent does the actual request.
 * @param {Array} roleOptions - [{ value, label }] for the role selector. Defaults
 *   to `roleFilterOptions` from "./firm-user-variants".
 * @param {string} defaultRole - Role preselected on open. Default "staff".
 * @param {boolean} submitting - Disables the form and shows a spinner on submit.
 * @param {string} error - Optional message from the parent (e.g. failed request).
 * @param {string} title - Dialog title. Default "Add User".
 * @param {string} description - Helper text under the title.
 * @param {string} submitLabel - Submit button label. Default "Add User".
 * @param {string} cancelLabel - Cancel button label. Default "Cancel".
 * @param {string} className - Extra classes merged onto the dialog content.
 */
export function FirmUserCreateDialog({
  open = false,
  onOpenChange,
  onSubmit,
  roleOptions = roleFilterOptions,
  defaultRole = "staff",
  submitting = false,
  error,
  title = "Add User",
  description = "Create a new user and assign them a role.",
  submitLabel = "Add User",
  cancelLabel = "Cancel",
  className,
  ...props
}) {
  // The dialog content unmounts when closed, so this state resets on every open.
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [extension, setExtension] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [role, setRole] = useState(() =>
    roleOptions.some((option) => option.value === defaultRole) ? defaultRole : ""
  )
  const [errors, setErrors] = useState({})

  const activeRole = roleOptions.find((option) => option.value === role)

  const handleSubmit = (event) => {
    event.preventDefault()

    const newErrors = {
      firstName: !firstName.trim(),
      lastName: !lastName.trim(),
      email: !email.trim() || !EMAIL_PATTERN.test(email.trim()),
      contactNumber: !contactNumber.trim() || !PHONE_PATTERN.test(contactNumber.trim()),
      temporaryPassword: temporaryPassword.length < 8,
      role: !role,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    onSubmit?.({
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      extension: extension.trim(),
      email: email.trim(),
      contactNumber: contactNumber.trim(),
      temporaryPassword,
      role,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="firm-user-create-dialog" className={className}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto">
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
              {errors.email && <p className="text-sm text-red-500">Enter a valid email address.</p>}
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
              <FieldLabel htmlFor="firm-user-temporary-password">
                Temporary password<span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="firm-user-temporary-password"
                type="password"
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                placeholder="••••••••"
                disabled={submitting}
                className={cn(
                  errors.temporaryPassword && "border-red-500 focus-visible:ring-red-500"
                )}
              />
              {errors.temporaryPassword ? (
                <p className="text-sm text-red-500">Password must be at least 8 characters.</p>
              ) : (
                <FieldDescription>
                  The user can change this after their first sign-in.
                </FieldDescription>
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
              onClick={() => onOpenChange?.(false)}
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
      </DialogContent>
    </Dialog>
  )
}

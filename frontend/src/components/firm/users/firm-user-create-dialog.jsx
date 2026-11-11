import { useEffect, useRef, useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { blockClipboard } from "@/lib/block-clipboard"
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
import { getZodFieldErrors, scrollToFirstInvalidField } from "@/lib/form-validation"
import { firmUserCreateSchema } from "@/schemas/userManagementSchema"

// Shown when the email address is already registered.
const DUPLICATE_EMAIL_ERROR = "The user already exist"

/**
 * Presentational "Add User" modal. Fully controlled by the parent, which owns
 * `open`/`onOpenChange` and performs the request after `onSubmit`.
 * The parent should pass a changing `key` on each open so the form resets.
 * `roleOptions` is [{ value: role_id, label: role_name }].
 */
export function FirmUserCreateDialog({
  open = false,
  onOpenChange,
  onSubmit,
  roleOptions = [],
  rolesLoading = false,
  defaultRole = "staff",
  submitting = false,
  error,
  existingEmails = [],
  title = "Add User",
  description = "Create a new user and assign them a role.",
  submitLabel = "Add User",
  cancelLabel = "Cancel",
  className,
  ...props
}) {
  const [firstName, setFirstName] = useState("")
  const [middleName, setMiddleName] = useState("")
  const [lastName, setLastName] = useState("")
  const [extension, setExtension] = useState("")
  const [email, setEmail] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [birthdate, setBirthdate] = useState("")
  const [temporaryPassword, setTemporaryPassword] = useState("")
  const [role, setRole] = useState(() =>
    roleOptions.some((option) => option.value === defaultRole) ? defaultRole : ""
  )
  const [errors, setErrors] = useState({})
  const formRef = useRef(null)

  // roleOptions often arrives async, so apply the default once it lands
  // without overwriting a role the user already picked.
  useEffect(() => {
    if (!role && roleOptions.some((option) => option.value === defaultRole)) {
      setRole(defaultRole)
    }
  }, [roleOptions, defaultRole, role])

  const activeRole = roleOptions.find((option) => option.value === role)
  const rolesUnavailable = !rolesLoading && roleOptions.length === 0

  const clearError = (field) => {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: false }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const newErrors = getZodFieldErrors(firmUserCreateSchema, {
      firstName,
      middleName,
      lastName,
      extension,
      email,
      contactNumber,
      birthdate,
      temporaryPassword,
      role,
    })

    // The account must not already exist.
    const emailExists = existingEmails.some(
      (existing) =>
        (existing ?? "").trim().toLowerCase() === email.trim().toLowerCase()
    )
    if (emailExists) newErrors.email = DUPLICATE_EMAIL_ERROR

    setErrors(newErrors)
    if (Object.keys(newErrors).length > 0) {
      scrollToFirstInvalidField(formRef.current)
      return
    }

    onSubmit?.({
      firstName: firstName.trim(),
      middleName: middleName.trim(),
      lastName: lastName.trim(),
      extension: extension.trim(),
      email: email.trim(),
      contactNumber: contactNumber.trim(),
      birthdate: birthdate.trim(),
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

        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto">
          <FieldGroup>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="firm-user-first-name">
                  First name<span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id="firm-user-first-name"
                  value={firstName}
                  onChange={(event) => {
                    setFirstName(event.target.value)
                    clearError("firstName")
                  }}
                  placeholder="Juan"
                  disabled={submitting}
                  aria-invalid={Boolean(errors.firstName) || undefined}
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
                  onChange={(event) => {
                    setLastName(event.target.value)
                    clearError("lastName")
                  }}
                  placeholder="Dela Cruz"
                  disabled={submitting}
                  aria-invalid={Boolean(errors.lastName) || undefined}
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
                onChange={(event) => {
                  setEmail(event.target.value)
                  clearError("email")
                }}
                placeholder="juan@example.com"
                disabled={submitting}
                aria-invalid={Boolean(errors.email) || undefined}
                className={cn(errors.email && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.email && (
                <p className="text-sm text-red-500">
                  {errors.email === DUPLICATE_EMAIL_ERROR
                    ? errors.email
                    : "Enter a valid email address."}
                </p>
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
                onChange={(event) => {
                  setContactNumber(event.target.value)
                  clearError("contactNumber")
                }}
                placeholder="0917 123 4567"
                disabled={submitting}
                aria-invalid={Boolean(errors.contactNumber) || undefined}
                className={cn(errors.contactNumber && "border-red-500 focus-visible:ring-red-500")}
              />
              {errors.contactNumber && (
                <p className="text-sm text-red-500">Enter a valid contact number.</p>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="firm-user-birthdate">Birthday</FieldLabel>
              <Input
                id="firm-user-birthdate"
                name="birthdate"
                type="date"
                value={birthdate}
                onChange={(event) => setBirthdate(event.target.value)}
                disabled={submitting}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="firm-user-temporary-password">
                Temporary password<span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                id="firm-user-temporary-password"
                type="password"
                value={temporaryPassword}
                onChange={(event) => {
                  setTemporaryPassword(event.target.value)
                  clearError("temporaryPassword")
                }}
                placeholder="••••••••"
                disabled={submitting}
                aria-invalid={Boolean(errors.temporaryPassword) || undefined}
                {...blockClipboard}
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
                      disabled={submitting || rolesLoading || rolesUnavailable}
                      aria-invalid={Boolean(errors.role) || undefined}
                      className={cn(
                        "h-8 w-full justify-between rounded-lg px-2.5 font-normal",
                        errors.role && "border-red-500 focus-visible:ring-red-500"
                      )}
                    />
                  }
                >
                  {rolesLoading ? (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin" />
                      Loading roles…
                    </span>
                  ) : (
                    activeRole?.label ?? "Select role"
                  )}
                  <ChevronDown className="size-4 opacity-60" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="min-w-40">
                  {roleOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => {
                        setRole(option.value)
                        clearError("role")
                      }}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.role && <p className="text-sm text-red-500">Select a role.</p>}
              {rolesUnavailable && (
                <p className="text-sm text-muted-foreground">
                  No roles available. Check the roles table.
                </p>
              )}
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
              disabled={submitting || rolesUnavailable}
              className="bg-forest-900 text-white hover:opacity-90"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? "Adding…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
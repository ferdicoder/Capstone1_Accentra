import { useState } from "react"
import { ChevronDown, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { roleFilterOptions } from "./firm-user-variants"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Presentational "Add User" slide-over form for the firm user list.
 * Fully controlled: the parent owns `open`/`onOpenChange` and performs any
 * API work after receiving the values from `onSubmit`. No API/auth/routing.
 *
 * @param {boolean} open - Whether the panel is visible.
 * @param {Function} onOpenChange - (open: boolean) => void.
 * @param {Function} onSubmit - (values: { firstName, lastName, email, role }) => void.
 *   Values are validated before being passed up; parent does the actual request.
 * @param {Array} roleOptions - [{ value, label }] for the role selector. Defaults
 *   to `roleFilterOptions` from "./firm-user-variants".
 * @param {string} defaultRole - Role preselected on open. Default "staff".
 * @param {boolean} submitting - Disables the form and shows a spinner on submit.
 * @param {string} error - Optional message from the parent (e.g. failed request).
 * @param {string} title - Panel title. Default "Add User".
 * @param {string} description - Helper text under the title.
 * @param {string} submitLabel - Submit button label. Default "Add User".
 * @param {string} cancelLabel - Cancel button label. Default "Cancel".
 * @param {string} className - Extra classes merged onto the sheet content.
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
  // The sheet content unmounts when closed, so this state resets on every open.
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
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
      role: !role,
    }
    setErrors(newErrors)
    if (Object.values(newErrors).some(Boolean)) return

    onSubmit?.({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      role,
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} {...props}>
      <SheetContent side="right" data-slot="firm-user-create-dialog" className={className}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-4 pb-4">
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

          <SheetFooter className="mt-auto flex-row justify-end gap-2 px-0 pb-0">
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

import { useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Check, Pencil, Save, ShieldQuestion, X } from "lucide-react"

import { AdminForgotPasswordModal } from "@/components/firm/admin-forgot-password-modal"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchUsers } from "@/hooks/useUsers"
import { authStore } from "@/store/authStore"
import {
  getZodFieldErrors,
  sanitizeNameInput,
  sanitizePhoneInput,
  scrollToFirstInvalidField,
} from "@/lib/form-validation"
import { passwordRequirements } from "@/lib/passwordRequirements"
import {
  passwordChangeSchema,
  profilePersonalInfoSchema,
} from "@/schemas/profileSchema"
import {
  changeAuthenticatedPassword,
  getPasswordReuseMessage,
} from "@/services/authService"
import { cn } from "@/lib/utils"

import { buttonVariants, Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FirmUserRoleBadge } from "@/components/firm/users/firm-user-role-badge"
import { FirmUserStatusBadge } from "@/components/firm/users/firm-user-status-badge"

const controlClass = "w-full bg-background"
const readOnlyClass = cn(controlClass, "cursor-not-allowed bg-muted/50 text-muted-foreground")
const initialSecurity = { currentPassword: "", newPassword: "", confirmPassword: "" }

const getInitials = (name) => {
  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "AC"
}

function StaffSettings({ profile, role }) {
  const [activeTab, setActiveTab] = useState("personal")
  const [editing, setEditing] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [personalInfoErrors, setPersonalInfoErrors] = useState({})
  const [security, setSecurity] = useState(initialSecurity)
  const [securityErrors, setSecurityErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const passwordSaveInProgress = useRef(false)
  const securityFormRef = useRef(null)
  const personalInfoFormRef = useRef(null)
  const [personalInfo, setPersonalInfo] = useState({
    firstName: profile.firstName,
    middleName: profile.middleName,
    lastName: profile.lastName,
    contactNumber: profile.contactNumber,
  })
  const savedInfo = useRef(personalInfo)

  const displayName =
    [personalInfo.firstName, personalInfo.middleName, personalInfo.lastName]
      .filter(Boolean)
      .join(" ") || profile.name || "Staff Settings"

  const handleSavePersonalInfo = (event) => {
    event.preventDefault()
    if (!editing) return

    const errors = getZodFieldErrors(profilePersonalInfoSchema, personalInfo)
    setPersonalInfoErrors(errors)
    if (Object.keys(errors).length > 0) {
      setSaveMessage({ type: "error", text: Object.values(errors)[0] })
      scrollToFirstInvalidField(personalInfoFormRef.current)
      return
    }

    setConfirmationOpen(true)
  }

  const updatePersonalInfo = (event) => {
    const { name, value } = event.target
    const nextValue = name === "contactNumber"
      ? sanitizePhoneInput(value)
      : ["firstName", "middleName", "lastName"].includes(name)
        ? sanitizeNameInput(value)
        : value
    setPersonalInfo((current) => ({ ...current, [name]: nextValue }))
    setPersonalInfoErrors((current) => ({ ...current, [name]: undefined }))
    setSaveMessage(null)
  }

  const cancelEditing = () => {
    setPersonalInfo(savedInfo.current)
    setPersonalInfoErrors({})
    setEditing(false)
    setConfirmationOpen(false)
    setSaveMessage(null)
  }

  const confirmChanges = () => {
    savedInfo.current = { ...personalInfo }
    setEditing(false)
    setConfirmationOpen(false)
    setSaveMessage({
      type: "success",
      text: "Personal information updated for this session.",
    })
  }

  const updateSecurityField = (name, value) => {
    setSecurity((current) => ({ ...current, [name]: value }))
    setSecurityErrors((current) => ({ ...current, [name]: undefined }))
    setSaveMessage(null)
  }

  const handleSavePassword = async (event) => {
    event.preventDefault()
    if (passwordSaveInProgress.current) return

    const nextErrors = getZodFieldErrors(passwordChangeSchema, security)

    setSecurityErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setSaveMessage(null)
      scrollToFirstInvalidField(securityFormRef.current)
      return
    }

    passwordSaveInProgress.current = true
    setIsSaving(true)
    setSaveMessage(null)
    try {
      await changeAuthenticatedPassword({
        currentPassword: security.currentPassword,
        newPassword: security.newPassword,
      })
      setSecurity(initialSecurity)
      setSecurityErrors({})
      setSaveMessage({ type: "success", text: "Password updated successfully." })
    } catch (error) {
      console.error("Staff password change failed:", error?.message)
      const reuseMessage = getPasswordReuseMessage(error)
      if (reuseMessage) {
        setSecurity((current) => ({ ...current, currentPassword: "" }))
        setSecurityErrors({ newPassword: reuseMessage })
        setSaveMessage(null)
        return
      }
      setSecurity(initialSecurity)
      if (error?.message === "Current password is incorrect.") {
        setSecurityErrors({ currentPassword: error.message })
      } else {
        setSaveMessage({
          type: "error",
          text: "We couldn't update your password. Please try again.",
        })
      }
    } finally {
      passwordSaveInProgress.current = false
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-white">
          {getInitials(displayName)}
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">{displayName}</h1>
        </div>
      </div>

      <div className="flex gap-8 border-b">
        {[
          { key: "personal", label: "Personal Information" },
          { key: "security", label: "Security" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => {
              if (editing) cancelEditing()
              setActiveTab(tab.key)
              setSaveMessage(null)
            }}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm font-medium transition-colors",
              activeTab === tab.key
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {saveMessage && (
        <div
          role={saveMessage.type === "error" ? "alert" : "status"}
          aria-live={saveMessage.type === "error" ? "assertive" : "polite"}
          className={cn(
            "rounded-lg px-4 py-2.5 text-sm",
            saveMessage.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 ring-inset"
              : "bg-red-500/10 text-red-600 ring-1 ring-red-500/20 ring-inset"
          )}
        >
          {saveMessage.text}
        </div>
      )}

      {activeTab === "personal" && (
        <form
          ref={personalInfoFormRef}
          onSubmit={handleSavePersonalInfo}
          noValidate
          className="flex flex-col gap-6"
        >
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-sm font-semibold">Personal Information</h2>
              <p className="mb-5 mt-1 text-sm text-muted-foreground">
                Your contact details for the firm.
              </p>
              <FieldGroup className="gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="staff-first-name">First Name</FieldLabel>
                    <Input
                      id="staff-first-name"
                      name="firstName"
                      value={personalInfo.firstName}
                      onChange={updatePersonalInfo}
                      disabled={!editing}
                      aria-invalid={Boolean(personalInfoErrors.firstName) || undefined}
                      data-invalid-field={personalInfoErrors.firstName ? "true" : undefined}
                      className={controlClass}
                    />
                    {personalInfoErrors.firstName && (
                      <FieldError>{personalInfoErrors.firstName}</FieldError>
                    )}
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="staff-middle-name">Middle Name</FieldLabel>
                    <Input
                      id="staff-middle-name"
                      name="middleName"
                      value={personalInfo.middleName}
                      onChange={updatePersonalInfo}
                      disabled={!editing}
                      aria-invalid={Boolean(personalInfoErrors.middleName) || undefined}
                      data-invalid-field={personalInfoErrors.middleName ? "true" : undefined}
                      className={controlClass}
                    />
                    {personalInfoErrors.middleName && (
                      <FieldError>{personalInfoErrors.middleName}</FieldError>
                    )}
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="staff-last-name">Last Name</FieldLabel>
                  <Input
                    id="staff-last-name"
                    name="lastName"
                    value={personalInfo.lastName}
                    onChange={updatePersonalInfo}
                    disabled={!editing}
                    aria-invalid={Boolean(personalInfoErrors.lastName) || undefined}
                    data-invalid-field={personalInfoErrors.lastName ? "true" : undefined}
                    className={controlClass}
                  />
                  {personalInfoErrors.lastName && (
                    <FieldError>{personalInfoErrors.lastName}</FieldError>
                  )}
                </Field>
                <Field>
                  <FieldLabel htmlFor="staff-email">Email Address</FieldLabel>
                  <Input
                    id="staff-email"
                    type="email"
                    value={profile.email}
                    readOnly
                    disabled
                    className={readOnlyClass}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="staff-contact-number">Contact Number</FieldLabel>
                  <Input
                    id="staff-contact-number"
                    name="contactNumber"
                    type="tel"
                    inputMode="tel"
                    value={personalInfo.contactNumber}
                    onChange={updatePersonalInfo}
                    disabled={!editing}
                    aria-invalid={Boolean(personalInfoErrors.contactNumber) || undefined}
                    data-invalid-field={personalInfoErrors.contactNumber ? "true" : undefined}
                    className={controlClass}
                  />
                  {personalInfoErrors.contactNumber && (
                    <FieldError>{personalInfoErrors.contactNumber}</FieldError>
                  )}
                </Field>
              </FieldGroup>

              <div className="mt-6 border-t border-border pt-5">
                <h2 className="mb-5 text-sm font-semibold">Account Information</h2>
                <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel>Role</FieldLabel>
                  <div className="flex h-8 items-center">
                    <FirmUserRoleBadge role={role} />
                  </div>
                </Field>
                {profile.status && (
                  <Field>
                    <FieldLabel>Status</FieldLabel>
                    <div className="flex h-8 items-center">
                      <FirmUserStatusBadge status={profile.status} />
                    </div>
                  </Field>
                )}
                </FieldGroup>
              </div>
          </div>

          <div className="flex justify-end gap-2">
            {editing ? (
              <>
                <Button type="button" variant="outline" onClick={cancelEditing}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 bg-forest-900 text-white hover:opacity-90"
                >
                  <Save className="size-4" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                type="button"
                onClick={() => {
                  setSaveMessage(null)
                  setEditing(true)
                }}
                className="gap-2 bg-forest-900 text-white hover:opacity-90"
              >
                <Pencil className="size-4" />
                Edit
              </Button>
            )}
          </div>
        </form>
      )}

      {activeTab === "security" && (
        <form
          ref={securityFormRef}
          onSubmit={handleSavePassword}
          noValidate
          className="flex flex-col gap-6"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm lg:col-span-2">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Change Password</h2>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="flex cursor-pointer items-center gap-1.5 text-sm font-medium text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  <ShieldQuestion className="size-4" />
                  Forgot your current password?
                </button>
              </div>
              <FieldGroup className="gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(securityErrors.currentPassword) || undefined}>
                    <FieldLabel htmlFor="staff-current-password">
                      Current Password<span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id="staff-current-password"
                      type="password"
                      autoComplete="current-password"
                      value={security.currentPassword}
                      onValueChange={(value) => updateSecurityField("currentPassword", value)}
                      disabled={isSaving}
                      aria-required="true"
                      aria-invalid={Boolean(securityErrors.currentPassword) || undefined}
                      aria-describedby={
                        securityErrors.currentPassword ? "staff-current-password-error" : undefined
                      }
                      className={controlClass}
                    />
                    <FieldError id="staff-current-password-error">
                      {securityErrors.currentPassword}
                    </FieldError>
                  </Field>
                  <div />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field data-invalid={Boolean(securityErrors.newPassword) || undefined}>
                    <FieldLabel htmlFor="staff-new-password">
                      New Password<span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id="staff-new-password"
                      type="password"
                      autoComplete="new-password"
                      value={security.newPassword}
                      onValueChange={(value) => updateSecurityField("newPassword", value)}
                      disabled={isSaving}
                      aria-required="true"
                      aria-invalid={Boolean(securityErrors.newPassword) || undefined}
                      aria-describedby={
                        securityErrors.newPassword ? "staff-new-password-error" : undefined
                      }
                      className={controlClass}
                    />
                    <FieldError id="staff-new-password-error">
                      {securityErrors.newPassword}
                    </FieldError>
                  </Field>
                  <Field data-invalid={Boolean(securityErrors.confirmPassword) || undefined}>
                    <FieldLabel htmlFor="staff-confirm-password">
                      Confirm New Password<span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      id="staff-confirm-password"
                      type="password"
                      autoComplete="new-password"
                      value={security.confirmPassword}
                      onValueChange={(value) => updateSecurityField("confirmPassword", value)}
                      disabled={isSaving}
                      aria-required="true"
                      aria-invalid={Boolean(securityErrors.confirmPassword) || undefined}
                      aria-describedby={
                        securityErrors.confirmPassword ? "staff-confirm-password-error" : undefined
                      }
                      className={controlClass}
                    />
                    <FieldError id="staff-confirm-password-error">
                      {securityErrors.confirmPassword}
                    </FieldError>
                  </Field>
                </div>
                <ul className="flex flex-col gap-1 text-xs">
                  {passwordRequirements.map((requirement) => (
                    <li
                      key={requirement.key}
                      className={cn(
                        "flex items-center gap-2 transition-colors",
                        requirement.test(security.newPassword)
                          ? "text-emerald-700"
                          : "text-muted-foreground"
                      )}
                    >
                      {requirement.test(security.newPassword) ? (
                        <Check aria-hidden="true" className="size-3.5 shrink-0" />
                      ) : (
                        <X aria-hidden="true" className="size-3.5 shrink-0" />
                      )}
                      {requirement.label}
                    </li>
                  ))}
                </ul>
              </FieldGroup>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isSaving}
              className="gap-2 bg-forest-900 text-white hover:opacity-90"
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Update Password"}
            </Button>
          </div>
        </form>
      )}

      {isForgotPasswordOpen && (
        <AdminForgotPasswordModal
          floating
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      )}

      <Dialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmationOpen(false)
        }}
      >
        <DialogContent data-slot="staff-settings-save-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm changes</DialogTitle>
            <DialogDescription>
              Save your changes to Personal Information? These changes apply to this session only.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmChanges}
              className="bg-forest-900 text-white hover:opacity-90"
            >
              Confirm and Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * With an :id this shows that staff member (reached from User Management),
 * without one it shows the signed-in firm staff member's settings.
 */
export default function StaffProfilePage() {
  const { id } = useParams()
  const isOwnProfile = !id
  const authUser = authStore((state) => state.user)
  const authRole = authStore((state) => state.role)
  const { data: users = [], isLoading: usersLoading } = useFetchUsers()
  const staffUser = useMemo(
    () => (isOwnProfile ? null : users.find((user) => user.id === id) ?? null),
    [isOwnProfile, users, id]
  )

  const profile = useMemo(() => {
    if (isOwnProfile) {
      return {
        firstName: authUser?.firstName ?? "",
        middleName: authUser?.middleName ?? "",
        lastName: authUser?.lastName ?? "",
        name: authUser?.name ?? "",
        email: authUser?.email ?? "",
        contactNumber: authUser?.contactNumber ?? "",
        role: authRole ?? "",
        status: "",
      }
    }

    return {
      firstName: staffUser?.firstName ?? "",
      middleName: staffUser?.middleName ?? "",
      lastName: staffUser?.lastName ?? "",
      name: staffUser?.name ?? "",
      email: staffUser?.email ?? "",
      contactNumber: staffUser?.contactNumber ?? "",
      role: staffUser?.role ?? "",
      status: staffUser?.status ?? "",
    }
  }, [isOwnProfile, authUser, authRole, staffUser])

  usePageMeta({
    title: isOwnProfile ? "My Settings" : "Staff Profile",
    breadcrumbs: isOwnProfile
      ? [{
          label: "Dashboard",
          href: authRole === "billing_officer" ? "/billing-officer/dashboard" : "/firm/dashboard",
        }]
      : [{ label: "User Management", href: "/admin/users" }],
    hasUnreadNotifications: true,
  })

  if (isOwnProfile) {
    return <StaffSettings profile={profile} role={authRole} />
  }

  if (usersLoading || !staffUser) {
    return <PageSkeleton type="profile" />
  }

  const displayName = profile.name || "Staff Profile"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
      <div className="flex flex-wrap items-center gap-3 py-1">
        <Link
          to="/admin/users"
          className={buttonVariants({
            variant: "ghost",
            size: "sm",
            className: "cursor-pointer gap-2 text-muted-foreground",
          })}
        >
          <ArrowLeft className="size-4" />
          Back
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-white">
          {getInitials(displayName)}
        </div>
        <div>
          <h1 className="text-lg font-semibold leading-tight">{displayName}</h1>
          <p className="text-sm text-muted-foreground">Firm account</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold">Personal Information</h2>
          <FieldGroup className="gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel>First Name</FieldLabel>
                <Input value={profile.firstName} readOnly disabled className={readOnlyClass} />
              </Field>
              <Field>
                <FieldLabel>Middle Name</FieldLabel>
                <Input value={profile.middleName} readOnly disabled className={readOnlyClass} />
              </Field>
            </div>
            <Field>
              <FieldLabel>Last Name</FieldLabel>
              <Input value={profile.lastName} readOnly disabled className={readOnlyClass} />
            </Field>
            <Field>
              <FieldLabel>Email Address</FieldLabel>
              <Input value={profile.email} readOnly disabled className={readOnlyClass} />
            </Field>
            <Field>
              <FieldLabel>Contact Number</FieldLabel>
              <Input value={profile.contactNumber} readOnly disabled className={readOnlyClass} />
            </Field>
          </FieldGroup>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold">Account Information</h2>
          <FieldGroup className="gap-5">
            <Field>
              <FieldLabel>Role</FieldLabel>
              <div className="flex h-8 items-center">
                <FirmUserRoleBadge role={profile.role} />
              </div>
            </Field>
            {profile.status && (
              <Field>
                <FieldLabel>Status</FieldLabel>
                <div className="flex h-8 items-center">
                  <FirmUserStatusBadge status={profile.status} />
                </div>
              </Field>
            )}
          </FieldGroup>
        </div>
      </div>
    </div>
  )
}

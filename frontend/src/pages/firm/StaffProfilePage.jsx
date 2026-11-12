import { useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Loader2, Pencil, Save } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchUsers } from "@/hooks/useUsers"
import { useFetchMyProfile, useUpdateMyProfile } from "@/hooks/useMyProfile"
import { authStore } from "@/store/authStore"
import {
  getZodFieldErrors,
  sanitizeNameInput,
  sanitizePhoneInput,
  scrollToFirstInvalidField,
} from "@/lib/form-validation"
import { profilePersonalInfoSchema } from "@/schemas/profileSchema"
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

const controlClass = "w-full bg-background"
const readOnlyClass = cn(controlClass, "cursor-not-allowed bg-muted/50 text-muted-foreground")

const getInitials = (name) => {
  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "AC"
}

const buildFullName = (info) =>
  [info.firstName, info.middleName, info.lastName].filter(Boolean).join(" ")

function StaffSettings({ profile, role }) {
  const authUser = authStore((state) => state.user)
  const setAuth = authStore((state) => state.setAuth)
  const updateProfile = useUpdateMyProfile()
  const saving = updateProfile.isPending

  const [editing, setEditing] = useState(false)
  const [confirmationOpen, setConfirmationOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)
  const [personalInfoErrors, setPersonalInfoErrors] = useState({})
  const personalInfoFormRef = useRef(null)
  const [personalInfo, setPersonalInfo] = useState({
    firstName: profile.firstName,
    middleName: profile.middleName,
    lastName: profile.lastName,
    contactNumber: profile.contactNumber,
  })
  const savedInfo = useRef(personalInfo)

  const displayName = buildFullName(personalInfo) || profile.name || "Staff Settings"

  const handleSavePersonalInfo = (event) => {
    event.preventDefault()
    if (!editing || saving) return

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

  const confirmChanges = async () => {
    const payload = {
      userId: profile.id,
      firstName: personalInfo.firstName.trim(),
      middleName: personalInfo.middleName.trim(),
      lastName: personalInfo.lastName.trim(),
      contactNumber: personalInfo.contactNumber.trim(),
    }

    try {
      const updated = await updateProfile.mutateAsync(payload)
      const next = {
        firstName: updated?.firstName ?? payload.firstName,
        middleName: updated?.middleName ?? payload.middleName,
        lastName: updated?.lastName ?? payload.lastName,
        contactNumber: updated?.contactNumber ?? payload.contactNumber,
      }

      savedInfo.current = next
      setPersonalInfo(next)

      // Keep the header / sidebar name in sync. `name` must be set explicitly
      // because authStore.normalizeUser prefers an existing user.name.
     setAuth(
        { ...authUser, ...next, name: buildFullName(next) },
        role,
        authStore.getState().status
      )

      setEditing(false)
      setConfirmationOpen(false)
      setSaveMessage({ type: "success", text: "Personal information updated." })
    } catch (error) {
      setConfirmationOpen(false)
      setSaveMessage({
        type: "error",
        text: error?.message || "Could not save your changes. Please try again.",
      })
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-forest-900 text-sm font-semibold text-white">
          {getInitials(displayName)}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold leading-tight">{displayName}</h1>
          <FirmUserRoleBadge role={role} />
        </div>
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

      <form
        ref={personalInfoFormRef}
        onSubmit={handleSavePersonalInfo}
        noValidate
        className="flex flex-col gap-6"
      >
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Personal Information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Your contact details for the firm.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {editing ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2 bg-forest-900 text-white hover:opacity-90"
                  >
                    <Save className="size-4" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setSaveMessage(null)
                    setEditing(true)
                  }}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
              )}
            </div>
          </div>
          <FieldGroup className="gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="staff-first-name">First Name</FieldLabel>
                <Input
                  id="staff-first-name"
                  name="firstName"
                  value={personalInfo.firstName}
                  onChange={updatePersonalInfo}
                  disabled={!editing || saving}
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
                  disabled={!editing || saving}
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
                disabled={!editing || saving}
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
                disabled={!editing || saving}
                aria-invalid={Boolean(personalInfoErrors.contactNumber) || undefined}
                data-invalid-field={personalInfoErrors.contactNumber ? "true" : undefined}
                className={controlClass}
              />
              {personalInfoErrors.contactNumber && (
                <FieldError>{personalInfoErrors.contactNumber}</FieldError>
              )}
            </Field>
          </FieldGroup>

        </div>
      </form>

      <Dialog
        open={confirmationOpen}
        onOpenChange={(open) => {
          if (!open && !saving) setConfirmationOpen(false)
        }}
      >
        <DialogContent data-slot="staff-settings-save-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm changes</DialogTitle>
            <DialogDescription>
              Save your changes to Personal Information?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => setConfirmationOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmChanges}
              disabled={saving}
              className="gap-2 bg-forest-900 text-white hover:opacity-90"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving..." : "Confirm and Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * With an :id this shows that staff member (reached from Teams),
 * without one it shows the signed-in firm staff member's settings.
 */
export default function StaffProfilePage() {
  const { id } = useParams()
  const isOwnProfile = !id
  const authUser = authStore((state) => state.user)
  const authRole = authStore((state) => state.role)
  const { data: users = [], isLoading: usersLoading } = useFetchUsers()
  const { data: myProfile, isLoading: myProfileLoading } = useFetchMyProfile(
    isOwnProfile ? authUser?.id : undefined
  )
  const staffUser = useMemo(
    () => (isOwnProfile ? null : users.find((user) => user.id === id) ?? null),
    [isOwnProfile, users, id]
  )

  const profile = useMemo(() => {
    if (isOwnProfile) {
      // Server row wins; auth metadata is only a fallback if the row is missing.
      const source = myProfile ?? {}
      const firstName = source.firstName ?? authUser?.firstName ?? ""
      const middleName = source.middleName ?? authUser?.middleName ?? ""
      const lastName = source.lastName ?? authUser?.lastName ?? ""
      return {
        id: authUser?.id ?? "",
        firstName,
        middleName,
        lastName,
        name: buildFullName({ firstName, middleName, lastName }) || authUser?.name || "",
        email: source.email ?? authUser?.email ?? "",
        contactNumber: source.contactNumber ?? authUser?.contactNumber ?? "",
        role: authRole ?? "",
        status: "",
      }
    }

    return {
      id: staffUser?.id ?? "",
      firstName: staffUser?.firstName ?? "",
      middleName: staffUser?.middleName ?? "",
      lastName: staffUser?.lastName ?? "",
      name: staffUser?.name ?? "",
      email: staffUser?.email ?? "",
      contactNumber: staffUser?.contactNumber ?? "",
      role: staffUser?.role ?? "",
      status: staffUser?.status ?? "",
    }
  }, [isOwnProfile, authUser, authRole, staffUser, myProfile])

  usePageMeta({
    title: isOwnProfile ? "My Account" : "Staff Profile",
    breadcrumbs: isOwnProfile ? [] : [{ label: "Teams", href: "/admin/users" }],
    hasUnreadNotifications: true,
  })

  if (isOwnProfile) {
    // Wait for the fetch so the form initializes from the saved row.
    if (myProfileLoading) {
      return <PageSkeleton type="profile" />
    }
    return <StaffSettings key={profile.id} profile={profile} role={authRole} />
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
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold leading-tight">{displayName}</h1>
          <FirmUserRoleBadge role={profile.role} />
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
      </div>
    </div>
  )
}
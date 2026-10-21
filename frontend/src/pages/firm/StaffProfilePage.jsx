import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchUsers, useUserBirthdays } from "@/hooks/useUsers"
import { authStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

import { buttonVariants } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { FirmUserRoleBadge } from "@/components/firm/users/firm-user-role-badge"
import { FirmUserStatusBadge } from "@/components/firm/users/firm-user-status-badge"

const controlClass = "w-full bg-background"
const readOnlyClass = cn(controlClass, "cursor-not-allowed bg-muted/50 text-muted-foreground")

const formatDate = (value) => {
  if (!value) return "—"
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const getInitials = (name) => {
  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "AC"
}

/**
 * Staff Profile.
 *
 * With an :id it shows that staff member (reached from User Management),
 * without one it shows the signed-in firm staff member.
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

  const { data: birthdays = {} } = useUserBirthdays(
    useMemo(() => (staffUser ? [staffUser.id] : []), [staffUser])
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
        birthday: authUser?.birthDate ?? "",
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
      birthday: birthdays[staffUser?.id] ?? "",
    }
  }, [isOwnProfile, authUser, authRole, staffUser, birthdays])

  usePageMeta({
    title: isOwnProfile ? "My Profile" : "Staff Profile",
    breadcrumbs: isOwnProfile
      ? [{ label: "Home", href: "/firm/dashboard" }]
      : [{ label: "User Management", href: "/admin/users" }],
    hasUnreadNotifications: true,
  })

  const displayName = profile.name || "Staff Profile"
  const backHref = isOwnProfile ? "/firm/dashboard" : "/admin/users"

  if (!isOwnProfile && (usersLoading || !staffUser)) {
    return <PageSkeleton type="profile" />
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-2">
      <div className="flex flex-wrap items-center gap-3 py-1">
        <Link
          to={backHref}
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
          <p className="text-sm text-muted-foreground">
            {profile.role ? "Firm account" : "Account details"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-5 text-sm font-semibold">Personal Information</h2>
          <FieldGroup className="gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="staff-first-name">First Name</FieldLabel>
                <Input
                  id="staff-first-name"
                  value={profile.firstName}
                  readOnly
                  disabled
                  className={readOnlyClass}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="staff-middle-name">Middle Name</FieldLabel>
                <Input
                  id="staff-middle-name"
                  value={profile.middleName}
                  readOnly
                  disabled
                  className={readOnlyClass}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="staff-last-name">Last Name</FieldLabel>
                <Input
                  id="staff-last-name"
                  value={profile.lastName}
                  readOnly
                  disabled
                  className={readOnlyClass}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="staff-birthday">Birthday</FieldLabel>
                <Input
                  id="staff-birthday"
                  value={formatDate(profile.birthday)}
                  readOnly
                  disabled
                  className={readOnlyClass}
                />
              </Field>
            </div>

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
                value={profile.contactNumber}
                readOnly
                disabled
                className={readOnlyClass}
              />
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

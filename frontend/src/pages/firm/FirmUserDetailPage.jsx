import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, ChevronDown, Pencil } from "lucide-react"

import { FirmUserAvatar } from "@/components/firm/users/firm-user-avatar"
import { FirmUserRoleBadge } from "@/components/firm/users/firm-user-role-badge"
import { FirmUserStatusBadge } from "@/components/firm/users/firm-user-status-badge"
import { PageNotFound, PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchUsers } from "@/hooks/useUsers"
import { queryKeys } from "@/config/queryKeys"

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "staff", label: "Staff" },
  { value: "billing_officer", label: "Billing Officer" },
]

const displayValue = (value) => value || "—"

function DetailRow({ label, value, editing = false }) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-3 last:border-b-0 sm:grid-cols-[minmax(9rem,0.7fr)_minmax(0,1.3fr)] sm:items-center sm:gap-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd
        className={
          editing
            ? "rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground"
            : "min-w-0 break-words text-sm text-foreground"
        }
      >
        {displayValue(value)}
      </dd>
    </div>
  )
}

export default function FirmUserDetailPage() {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: users = [], isLoading, error } = useFetchUsers()
  const user = useMemo(() => users.find((item) => String(item.id) === id) ?? null, [users, id])
  const [editing, setEditing] = useState(false)
  const [selectedRole, setSelectedRole] = useState("")
  const [confirmationOpen, setConfirmationOpen] = useState(false)

  usePageMeta({
    title: user?.name || "Firm User Details",
    breadcrumbs: [{ label: "User Management", href: "/admin/users" }],
  })

  const backButton = (
    <Link
      to="/admin/users"
      className={buttonVariants({
        variant: "ghost",
        size: "sm",
        className: "cursor-pointer gap-1.5 text-muted-foreground",
      })}
    >
      <ArrowLeft className="size-4" />
      Back
    </Link>
  )

  if (isLoading) return <PageSkeleton />

  if (error || !user) {
    return (
      <>
        <div className="flex flex-wrap items-center gap-3 py-1">{backButton}</div>
        <PageNotFound
          title={error ? "Unable to Load User" : "Firm User Not Found"}
          message={
            error
              ? "The firm user could not be loaded. Please try again."
              : "The requested firm user could not be found."
          }
          actionLabel="Back to User Management"
          actionHref="/admin/users"
        />
      </>
    )
  }

  const roleLabel = roleOptions.find((option) => option.value === user.role)?.label ?? user.role

  const confirmRoleChange = () => {
    queryClient.setQueryData(queryKeys.users, (currentUsers = []) =>
      currentUsers.map((currentUser) =>
        currentUser.id === user.id ? { ...currentUser, role: selectedRole } : currentUser
      )
    )
    setEditing(false)
    setConfirmationOpen(false)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">{backButton}</div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-lg font-semibold text-foreground">Firm User Details</h2>
          <p className="text-sm text-muted-foreground">
            View account information. Only the user's role can be changed here.
          </p>
        </div>

        {editing ? (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRole(user.role)
                setEditing(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-forest-900 text-white hover:opacity-90"
              disabled={!selectedRole || selectedRole === user.role}
              onClick={() => setConfirmationOpen(true)}
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
            onClick={() => {
              setSelectedRole(user.role)
              setEditing(true)
            }}
          >
            <Pencil className="size-4" />
            Edit Role
          </Button>
        )}
      </div>

      <section
        data-slot="firm-user-details-card"
        className="rounded-xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-3">
          <FirmUserAvatar name={user.name} size="lg" />
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-semibold">{user.name}</h3>
              <FirmUserStatusBadge status={user.status} className="shrink-0" />
            </div>
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
          <div className="min-w-0">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Personal Information
            </h3>
            <dl className="divide-y divide-border/60">
              <DetailRow label="First name" value={user.firstName} editing={editing} />
              <DetailRow label="Middle name" value={user.middleName} editing={editing} />
              <DetailRow label="Last name" value={user.lastName} editing={editing} />
              <DetailRow label="Email" value={user.email} editing={editing} />
              <DetailRow label="Contact number" value={user.contactNumber} editing={editing} />
            </dl>
          </div>

          <div className="min-w-0">
            <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Account Access
            </h3>
            <dl className="divide-y divide-border/60">
              <div className="grid gap-1 border-b border-border/60 py-3 sm:grid-cols-[minmax(9rem,0.7fr)_minmax(0,1.3fr)] sm:items-center sm:gap-4">
                <dt className="text-xs font-medium text-muted-foreground">Role</dt>
                <dd>
                  {editing ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="outline"
                            className="h-9 w-full justify-between rounded-lg px-3 font-normal sm:max-w-64"
                          />
                        }
                      >
                        {roleOptions.find((option) => option.value === selectedRole)?.label ?? "Select role"}
                        <ChevronDown className="size-4 opacity-60" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-40">
                        {roleOptions.map((option) => (
                          <DropdownMenuItem
                            key={option.value}
                            onClick={() => setSelectedRole(option.value)}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <FirmUserRoleBadge role={user.role} roleLabels={{ [user.role]: roleLabel }} />
                  )}
                </dd>
              </div>
              <DetailRow label="Account status" value={user.status} editing={editing} />
              <DetailRow label="User ID" value={user.id} editing={editing} />
            </dl>
          </div>
        </div>
      </section>

      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent data-slot="firm-user-role-confirmation">
          <DialogHeader>
            <DialogTitle>Confirm role change</DialogTitle>
            <DialogDescription>
              Change this user&apos;s role from{" "}
              <span className="font-medium text-foreground">{user.role}</span> to{" "}
              <span className="font-medium text-foreground">
                {roleOptions.find((option) => option.value === selectedRole)?.label ?? selectedRole}
              </span>
              ? This change is only applied in the current session and will not persist after a refresh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedRole(user.role)
                setEditing(false)
                setConfirmationOpen(false)
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-forest-900 text-white hover:opacity-90"
              onClick={confirmRoleChange}
            >
              Okay
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

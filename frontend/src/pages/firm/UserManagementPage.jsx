import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Ban, CheckCircle2, Pencil, User } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { FirmUsersToolbar } from "@/components/firm/users/firm-users-toolbar"
import { FirmUserTable } from "@/components/firm/users/firm-user-table"
import { FirmUserActionsMenu } from "@/components/firm/users/firm-user-actions-menu"
import { FirmUserCreateDialog } from "@/components/firm/users/firm-user-create-dialog"
import { FirmUserEditDialog } from "@/components/firm/users/firm-user-edit-dialog"
import { FirmUserStatusDialog } from "@/components/firm/users/firm-user-status-dialog"
import { FirmUserPagination } from "@/components/firm/users/firm-user-pagination"
import { authStore } from "@/store/authStore"

import {
  useFetchUsers,
  useUpdateUser,
  useToggleUserStatus,
  useCreateStaff,
  useFetchFirmRoles,
} from "@/hooks/useUsers"



const buildDisplayName = ({ firstName, middleName, lastName, extension, name }) => {
  if (name) return name

  return [firstName, middleName, lastName, extension].filter(Boolean).join(" ")
}

// Firm users shown per page.
const PAGE_SIZE = 8

export default function UserManagementPage() {
  const navigate = useNavigate()
  const authUser = authStore((state) => state.user)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(true)

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const { data: users = [], isLoading, error } = useFetchUsers()
  const { data: roles = [], isLoading: rolesLoading } = useFetchFirmRoles()
  const updateUser = useUpdateUser()
  const toggleStatus = useToggleUserStatus()
  const createStaff = useCreateStaff()

  // Emails already taken, so the Add User form can refuse a duplicate.
  const existingEmails = useMemo(
    () => users.map((user) => user.email).filter(Boolean),
    [users]
  )

  // DB-backed role list, shaped for the dropdowns (value = role_id, label = role_name).
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.role_id, label: role.role_name })),
    [roles]
  )


  // for searching
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    const matchingUsers = users.filter((user) => {
      const displayName = buildDisplayName(user).toLowerCase()
      const matchesSearch =
        !query || displayName.includes(query) || (user.email ?? "").toLowerCase().includes(query)
      const matchesRole = !roleFilter || user.role === roleFilter
      return matchesSearch && matchesRole
    })
    return matchingUsers
  }, [
    users,
    search,
    roleFilter,
  ])

  // The list is paginated, 8 firm users per page.
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  // Validation for the deactivate / reactivate action. An empty string means
  // the action may proceed.
  const validateStatusChange = (user, action) => {
    if (!user) return "This user could not be found."

    if (action === "reactivate") {
      if (user.status !== "deactivated") {
        return "This account is not deactivated, so there is nothing to reactivate."
      }
      return ""
    }

    if (user.id === authUser?.id) {
      return "You cannot deactivate the account you are signed in with."
    }

    const activeAdmins = users.filter(
      (item) => item.role === "admin" && item.status !== "deactivated"
    )
    if (user.role === "admin" && activeAdmins.length <= 1) {
      return "This is the only active firm administrator, so it cannot be deactivated."
    }

    return ""
  }

  const openStatusDialog = (user, action) => {
    setStatusTarget({ user, action })
  }

  const statusValidationError = statusTarget
    ? validateStatusChange(statusTarget.user, statusTarget.action)
    : ""

  const confirmStatusChange = () => {
    if (!statusTarget || statusValidationError) return

    // The users table only accepts "active" and "deactivated" — a
    // reactivated account goes back to "active" so it regains access.
    const nextStatus = statusTarget.action === "deactivate" ? "deactivated" : "active"

    toggleStatus.mutate(
      { id: statusTarget.user.id, status: nextStatus },
      {
        onSuccess: () => {
          setNotice(
            `${statusTarget.user.name} ${nextStatus === "deactivated" ? "deactivated" : "reactivated"}`
          )
          setStatusTarget(null)
        },
        onError: (error) => {
          console.error("Firm user status update failed:", error?.message)
          setNotice("We couldn't update this account. Please try again.")
        },
      }
    )
  }

  const handleCreate = (values) => {
    createStaff.mutate(values, {
      onSuccess() {
        setDialogOpen(false)
        setNotice(`${values.firstName} ${values.lastName} added`)
      },
    })
  }

  const openCreateDialog = () => {
    // Clear a previous attempt's error so it can't linger on a fresh form.
    createStaff.reset()
    setDialogOpen(true)
  }

  // The API wrapper reports every failure as "Staff creation failed", so the
  // most common causes are spelled out here instead.
  const createError = createStaff.error
    ? "We couldn't create this account. The email address may already be registered, or the password may not meet the account requirements."
    : ""

  const openEditDialog = (user) => {
    setEditingUser(user)
    setEditDialogOpen(true)
  }

  const openStaffProfile = (user) => {
    navigate(`/admin/staff/${user.id}`)
  }

  const handleSave = (values) => {
    updateUser.mutate(values, {
      onSuccess: () => {
        setEditDialogOpen(false)
        setNotice(`${values.firstName} ${values.lastName} updated`)
      },
    })
  }

  usePageMeta({
    title: "Firm Users",
    breadcrumbs: [
      { label: "Firm Admin", href: "/admin/dashboard" },
      { label: "User Management", href: "/admin/users" },
    ],
  })

  return (
    <>
      {loading || isLoading ? (
        <PageSkeleton type="users" />
      ) : (
        <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <p className="text-sm text-muted-foreground">
          Manage your firm's users and their access to the platform.
        </p>
        {notice && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </span>
        )}
        {error && (
          <span className="text-xs text-destructive">Failed to load users</span>
        )}
      </div>

      <FirmUsersToolbar
        searchValue={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        roleOptions={roleOptions}
        onAddUser={openCreateDialog}
        resultCount={`${filteredUsers.length} of ${users.length} users`}
      />

      <FirmUserTable
        users={paginatedUsers}
        loading={isLoading}
        emptyMessage="No users match your filters."
        emptyDescription="Try clearing the search or filters."
        onRowClick={openEditDialog}
        footer={
          <FirmUserPagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        }
        actions={(user) => (
          <FirmUserActionsMenu
            user={user}
            items={[
              { key: "profile", label: "View profile", icon: User, onSelect: () => openStaffProfile(user) },
              { key: "edit", label: "Edit user", icon: Pencil, onSelect: openEditDialog },
              { type: "separator" },
              user.status === "deactivated"
                ? { key: "activate", label: "Reactivate", icon: CheckCircle2, onSelect: (user) => openStatusDialog(user, "reactivate") }
                : { key: "deactivate", label: "Deactivate", icon: Ban, destructive: true, onSelect: (user) => openStatusDialog(user, "deactivate") },
            ]}
          />
        )}
      />

      <FirmUserCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        roleOptions={roleOptions}
        rolesLoading={rolesLoading}
        submitting={createStaff.isPending}
        existingEmails={existingEmails}
        error={createError}
      />

      <FirmUserStatusDialog
        open={Boolean(statusTarget)}
        onOpenChange={(open) => !open && setStatusTarget(null)}
        user={statusTarget?.user}
        action={statusTarget?.action}
        validationError={statusValidationError}
        submitting={toggleStatus.isPending}
        onConfirm={confirmStatusChange}
      />

      <FirmUserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={editingUser}
        onSubmit={handleSave}
        roleOptions={roleOptions}
        rolesLoading={rolesLoading}
        submitting={updateUser.isPending}
      />
        </>
      )}
    </>
  )
}
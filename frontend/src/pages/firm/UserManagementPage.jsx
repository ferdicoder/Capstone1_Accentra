import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { FirmUsersToolbar } from "@/components/firm/users/firm-users-toolbar"
import { FirmUserTable } from "@/components/firm/users/firm-user-table"
import { FirmUserCreateDialog } from "@/components/firm/users/firm-user-create-dialog"
import { FirmUserAvatar } from "@/components/firm/users/firm-user-avatar"
import { FirmUserRoleBadge } from "@/components/firm/users/firm-user-role-badge"
import { FirmUserStatusBadge } from "@/components/firm/users/firm-user-status-badge"
import { PAGE_SIZE } from "@/components/shared/pagination-footer"

import {
  useFetchUsers,
  useCreateStaff,
  useFetchFirmRoles,
} from "@/hooks/useUsers"

const buildDisplayName = ({ firstName, middleName, lastName, extension, name }) => {
  if (name) return name

  return [firstName, middleName, lastName, extension].filter(Boolean).join(" ")
}

/** Phone presentation of one team member: never lets the email or badges overlap. */
function FirmUserCard({ user }) {
  const displayName = buildDisplayName(user) || "Unnamed user"

  return (
    <>
      <div className="flex items-start gap-3">
        <FirmUserAvatar
          name={displayName}
          avatarUrl={user?.avatar_url ?? user?.avatar}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
          {user?.email && (
            <p className="text-xs break-all text-muted-foreground">{user.email}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <FirmUserRoleBadge role={user?.role} />
        <FirmUserStatusBadge status={user?.status} />
      </div>
    </>
  )
}

export default function UserManagementPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogKey, setDialogKey] = useState(0)
  const [page, setPage] = useState(1)
  const [notice, setNotice] = useState("")

  const { data: users = [], isLoading, error } = useFetchUsers()
  const { data: roles = [], isLoading: rolesLoading } = useFetchFirmRoles()
  const createStaff = useCreateStaff()

  // Clear the success notice after a few seconds.
  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(""), 4000)
    return () => clearTimeout(timer)
  }, [notice])

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

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const displayName = buildDisplayName(user).toLowerCase()
      const matchesSearch =
        !query || displayName.includes(query) || (user.email ?? "").toLowerCase().includes(query)
      const matchesRole = !roleFilter || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  // The list is paginated, 8 firm users per page.
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)

  const handleCreate = (values) => {
    createStaff.mutate(values, {
      onSuccess() {
        setDialogOpen(false)
        setNotice(`${values.firstName} ${values.lastName} added`)
      },
      onError(err) {
        console.error("Firm user creation failed:", err?.message)
      },
    })
  }

  const openCreateDialog = () => {
    // Fresh form and no leftover error on every open.
    createStaff.reset()
    setDialogKey((key) => key + 1)
    setDialogOpen(true)
  }

  const createError = createStaff.error
    ? createStaff.error.message || "We couldn't create this account. Please try again."
    : ""

  usePageMeta({
    title: "Teams",
    breadcrumbs: [
      { label: "Firm Admin", href: "/admin/dashboard" },
      { label: "Teams", href: "/admin/users" },
    ],
  })

  return (
    <>
      {isLoading ? (
        <PageSkeleton type="users" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 py-1">
            <p className="text-sm text-muted-foreground">
              Manage your firm's team members and their access to the platform.
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
            onSearchChange={(value) => {
              setSearch(value)
              setPage(1)
            }}
            roleFilter={roleFilter}
            onRoleFilterChange={(value) => {
              setRoleFilter(value)
              setPage(1)
            }}
            roleOptions={roleOptions}
            onAddUser={openCreateDialog}
            resultCount={`${filteredUsers.length} of ${users.length} users`}
          />

          <FirmUserTable
            users={filteredUsers}
            loading={isLoading}
            emptyMessage="No users match your filters."
            emptyDescription="Try clearing the search or filters."
            onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
            renderMobileCard={(user) => <FirmUserCard user={user} />}
            page={currentPage}
            onPageChange={setPage}
          />

          <FirmUserCreateDialog
            key={dialogKey}
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            onSubmit={handleCreate}
            roleOptions={roleOptions}
            rolesLoading={rolesLoading}
            submitting={createStaff.isPending}
            existingEmails={existingEmails}
            error={createError}
          />
        </>
      )}
    </>
  )
}
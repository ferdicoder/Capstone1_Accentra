import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Ban, CheckCircle2 } from "lucide-react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { FirmUsersToolbar } from "@/components/firm/users/firm-users-toolbar"
import { FirmUserTable } from "@/components/firm/users/firm-user-table"
import { FirmUserActionsMenu } from "@/components/firm/users/firm-user-actions-menu"
import { FirmUserCreateDialog } from "@/components/firm/users/firm-user-create-dialog"

import { useFetchUsers, useToggleUserStatus, useCreateStaff, useFetchFirmRoles } from "@/hooks/useUsers"



const buildDisplayName = ({ firstName, middleName, lastName, extension, name }) => {
  if (name) return name

  return [firstName, middleName, lastName, extension].filter(Boolean).join(" ")
}

export default function UserManagementPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [notice, setNotice] = useState("")
  const [loading, setLoading] = useState(true)

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const { data: users = [], isLoading, error } = useFetchUsers()
  const { data: roles = [], isLoading: rolesLoading } = useFetchFirmRoles()
  const toggleStatus = useToggleUserStatus()
  const createStaff = useCreateStaff()

  // DB-backed role list, shaped for the dropdowns (value = role_id, label = role_name).
  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role.role_id, label: role.role_name })),
    [roles]
  )


  // for searching
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

  const toggleDeactivate = (user) => {
    const nextStatus = user.status === "deactivated" ? "inactive" : "deactivated"
    toggleStatus.mutate({ id: user.id, status: nextStatus })
    setNotice(`${user.name} ${nextStatus === "deactivated" ? "deactivated" : "reactivated"}`)
  }

  const handleCreate = (values) => {
    createStaff.mutate(values, {
      onSuccess: () => {
        setDialogOpen(false)
        setNotice(`${values.firstName} ${values.lastName} added`)
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
        onSearchChange={(value) => {
          setSearch(value)
          setCurrentPage(1)
        }}
        roleFilter={roleFilter}
        onRoleFilterChange={(value) => {
          setRoleFilter(value)
          setCurrentPage(1)
        }}
        roleOptions={roleOptions}
        onAddUser={() => setDialogOpen(true)}
        resultCount={`${filteredUsers.length} of ${users.length} users`}
      />

      <FirmUserTable
        users={filteredUsers}
        loading={isLoading}
        emptyMessage="No users match your filters."
        emptyDescription="Try clearing the search or filters."
        onRowClick={(user) => navigate(`/admin/users/${user.id}`)}
        page={currentPage}
        onPageChange={setCurrentPage}
        actions={(user) => (
          <FirmUserActionsMenu
            user={user}
            items={[
              user.status === "deactivated"
                ? { key: "activate", label: "Reactivate", icon: CheckCircle2, onSelect: toggleDeactivate }
                : { key: "deactivate", label: "Deactivate", icon: Ban, destructive: true, onSelect: toggleDeactivate },
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
      />

        </>
      )}
    </>
  )
}
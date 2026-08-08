import { useEffect, useMemo, useState } from "react"
import { Ban, CheckCircle2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/layout/DashboardLayout"
import { FirmUsersToolbar } from "@/components/firm/users/firm-users-toolbar"
import { FirmUserTable } from "@/components/firm/users/firm-user-table"
import { FirmUserActionsMenu } from "@/components/firm/users/firm-user-actions-menu"
import { FirmUserCreateDialog } from "@/components/firm/users/firm-user-create-dialog"
import { FirmUserEditDialog } from "@/components/firm/users/firm-user-edit-dialog"

import { useFetchUsers,useUpdateUser, useToggleUserStatus, useCreateStaff} from "@/hooks/useUsers"


const buildDisplayName = ({ firstName, middleName, lastName, extension, name }) => {
  if (name) return name

  return [firstName, middleName, lastName, extension].filter(Boolean).join(" ")
}

export default function UserManagementPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [notice, setNotice] = useState("")

  const { data: users = [], isLoading, error } = useFetchUsers() 
  const updateUser = useUpdateUser()
  const toggleStatus = useToggleUserStatus()
  const createStaff = useCreateStaff()

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

  const openEditDialog = (user) => {
    setEditingUser(user)
    setEditDialogOpen(true)
  }

  const handleSave = (values) => {
    updateUser.mutate(values, {
      onSuccess: () => {
        setEditDialogOpen(false)
        setNotice(`${values.firstName} ${values.lastName} updated`)
      },
    })
  }

  return (
    <DashboardLayout
      role="firm-admin"
      title="Firm Users"
      breadcrumbs={[
        { label: "Firm Admin", href: "/admin/dashboard" },
        { label: "User Management", href: "/admin/users" },
      ]}
    >
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
        onAddUser={() => setDialogOpen(true)}
        resultCount={`${filteredUsers.length} of ${users.length} users`}
      />

      <FirmUserTable
        users={filteredUsers}
        loading={isLoading}
        emptyMessage="No users match your filters."
        emptyDescription="Try clearing the search or filters."
        actions={(user) => (
          <FirmUserActionsMenu
            user={user}
            items={[
              { key: "edit", label: "Edit user", icon: Pencil, onSelect: openEditDialog },
              { type: "separator" },
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
        submitting={createStaff.isPending}
      />

      <FirmUserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={editingUser}
        onSubmit={handleSave}
        submitting={updateUser.isPending}
      />
    </DashboardLayout>
  )
}
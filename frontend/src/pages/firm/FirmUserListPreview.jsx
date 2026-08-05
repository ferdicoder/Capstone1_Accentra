// TEMPORARY PREVIEW PAGE — created so the FirmUserList components can be
// viewed in the browser. Not part of the real app. Delete this file (and its
// route in src/routes/Routes.jsx) once the real FirmUserList page exists.

import { useMemo, useState } from "react"
import { Ban, CheckCircle2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/layout/DashboardLayout"
import { FirmUsersToolbar } from "@/components/firm/users/firm-users-toolbar"
import { FirmUserTable } from "@/components/firm/users/firm-user-table"
import { FirmUserActionsMenu } from "@/components/firm/users/firm-user-actions-menu"
import { FirmUserCreateDialog } from "@/components/firm/users/firm-user-create-dialog"

const mockUsers = [
  {
    id: "1",
    name: "Juan Dela Cruz",
    email: "juan@accentra.ph",
    role: "admin",
    status: "active",
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@accentra.ph",
    role: "staff",
    status: "active",
  },
  {
    id: "3",
    name: "Pedro Ramos",
    email: "pedro@accentra.ph",
    role: "accountant",
    status: "invited",
  },
  {
    id: "4",
    name: "Ana Reyes",
    email: "ana@accentra.ph",
    role: "staff",
    status: "suspended",
  },
  {
    id: "5",
    name: "Luis Garcia",
    email: "luis@accentra.ph",
    role: "partner",
    status: "inactive",
  },
]

export default function FirmUserListPreview() {
  const [users, setUsers] = useState(mockUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [notice, setNotice] = useState("")

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      const matchesRole = !roleFilter || user.role === roleFilter
      const matchesStatus = !statusFilter || user.status === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const toggleSuspend = (user) => {
    const nextStatus = user.status === "suspended" ? "active" : "suspended"
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    )
    setNotice(
      `${user.name} ${nextStatus === "suspended" ? "suspended" : "reactivated"}`
    )
  }

  const handleCreate = (values) => {
    setSubmitting(true)
    // Simulated request — swap for a real API call later.
    setTimeout(() => {
      setUsers((prev) => [
        {
          id: String(Date.now()),
          name: `${values.firstName} ${values.lastName}`,
          email: values.email,
          role: values.role,
          status: "invited",
        },
        ...prev,
      ])
      setSubmitting(false)
      setDialogOpen(false)
      setNotice(`${values.firstName} ${values.lastName} invited`)
    }, 800)
  }

  return (
    <DashboardLayout
      role="firm-admin"
      title="Firm Users"
      breadcrumbs={[
        { label: "Firm Admin", href: "/firm-admin/dashboard" },
        { label: "User Management", href: "/firm-admin/user-management" },
      ]}
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLoading((value) => !value)}
        >
          {loading ? "Hide skeleton" : "Show loading skeleton"}
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-3 py-1">
        <p className="text-sm text-muted-foreground">
          Manage your firm's users and their access to the platform. You can invite new users, edit existing users, and suspend or reactivate users as needed.
          
        </p>
        {notice && (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-500/20 ring-inset">
            {notice}
          </span>
        )}
      </div>

      <FirmUsersToolbar
        searchValue={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onAddUser={() => setDialogOpen(true)}
        resultCount={`${filteredUsers.length} of ${users.length} users`}
      />

      <FirmUserTable
        users={filteredUsers}
        loading={loading}
        emptyMessage="No users match your filters."
        emptyDescription="Try clearing the search or filters."
        actions={(user) => (
          <FirmUserActionsMenu
            user={user}
            items={[
              {
                key: "edit",
                label: "Edit user",
                icon: Pencil,
                onSelect: (selected) => setNotice(`Edit ${selected.name}`),
              },
              { type: "separator" },
              user.status === "suspended"
                ? {
                    key: "activate",
                    label: "Reactivate",
                    icon: CheckCircle2,
                    onSelect: toggleSuspend,
                  }
                : {
                    key: "suspend",
                    label: "Suspend",
                    icon: Ban,
                    destructive: true,
                    onSelect: toggleSuspend,
                  },
            ]}
          />
        )}
      />

      <FirmUserCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCreate}
        submitting={submitting}
      />
    </DashboardLayout>
  )
}

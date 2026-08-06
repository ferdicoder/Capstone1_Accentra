import { useMemo, useState } from "react"
import { Ban, CheckCircle2, Pencil } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DashboardLayout } from "@/layout/DashboardLayout"
import { FirmUsersToolbar } from "@/components/firm/users/firm-users-toolbar"
import { FirmUserTable } from "@/components/firm/users/firm-user-table"
import { FirmUserActionsMenu } from "@/components/firm/users/firm-user-actions-menu"
import { FirmUserCreateDialog } from "@/components/firm/users/firm-user-create-dialog"
import { FirmUserEditDialog } from "@/components/firm/users/firm-user-edit-dialog"

const mockUsers = [
  {
    id: "1",
    firstName: "Juan",
    middleName: "Santos",
    lastName: "Dela Cruz",
    extension: "",
    name: "Juan Dela Cruz",
    email: "juan@accentra.ph",
    contactNumber: "0917 111 2233",
    role: "admin",
    status: "active",
  },
  {
    id: "2",
    firstName: "Maria",
    middleName: "",
    lastName: "Santos",
    extension: "",
    name: "Maria Santos",
    email: "maria@accentra.ph",
    contactNumber: "0918 222 3344",
    role: "staff",
    status: "active",
  },
  {
    id: "3",
    firstName: "Pedro",
    middleName: "Ramos",
    lastName: "Ramos",
    extension: "Jr.",
    name: "Pedro Ramos Jr.",
    email: "pedro@accentra.ph",
    contactNumber: "0919 333 4455",
    role: "staff",
    status: "inactive",
  },
  {
    id: "4",
    firstName: "Ana",
    middleName: "",
    lastName: "Reyes",
    extension: "",
    name: "Ana Reyes",
    email: "ana@accentra.ph",
    contactNumber: "0920 444 5566",
    role: "staff",
    status: "deactivated",
  },
  {
    id: "5",
    firstName: "Luis",
    middleName: "Miguel",
    lastName: "Garcia",
    extension: "",
    name: "Luis Garcia",
    email: "luis@accentra.ph",
    contactNumber: "0921 555 6677",
    role: "admin",
    status: "inactive",
  },
]

export default function UserManagementPage() {
  const [users, setUsers] = useState(mockUsers)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [notice, setNotice] = useState("")

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      const matchesRole = !roleFilter || user.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  // Deactivation is the only manual status change — the rest is derived from
  // system activity. Reactivating restores an account to its derived state
  // (inactive until the user signs in).
  const toggleDeactivate = (user) => {
    const nextStatus =
      user.status === "deactivated" ? "inactive" : "deactivated"
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
    )
    setNotice(
      `${user.name} ${nextStatus === "deactivated" ? "deactivated" : "reactivated"}`
    )
  }

  const handleCreate = (values) => {
    setSubmitting(true)
    // Simulated request — swap for a real API call later.
    setTimeout(() => {
      setUsers((prev) => [
        {
          id: String(Date.now()),
          firstName: values.firstName,
          middleName: values.middleName,
          lastName: values.lastName,
          extension: values.extension,
          name: [
            values.firstName,
            values.middleName,
            values.lastName,
            values.extension,
          ]
            .filter(Boolean)
            .join(" "),
          email: values.email,
          contactNumber: values.contactNumber,
          role: values.role,
          status: "inactive", // derived: exists but hasn't signed in yet
        },
        ...prev,
      ])
      setSubmitting(false)
      setDialogOpen(false)
      setNotice(`${values.firstName} ${values.lastName} added`)
    }, 800)
  }

  const openEditDialog = (user) => {
    setEditingUser(user)
    setEditDialogOpen(true)
  }

  const handleSave = (values) => {
    setEditSubmitting(true)
    // Simulated request — swap for a real API call later.
    setTimeout(() => {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === values.id
            ? {
                ...user,
                firstName: values.firstName,
                middleName: values.middleName,
                lastName: values.lastName,
                extension: values.extension,
                name: [
                  values.firstName,
                  values.middleName,
                  values.lastName,
                  values.extension,
                ]
                  .filter(Boolean)
                  .join(" "),
                email: values.email,
                contactNumber: values.contactNumber,
                role: values.role,
              }
            : user
        )
      )
      setEditSubmitting(false)
      setEditDialogOpen(false)
      setNotice(`${values.firstName} ${values.lastName} updated`)
    }, 800)
  }

  return (
    <DashboardLayout
      role="firm-admin"
      title="Firm Users"
      breadcrumbs={[
        { label: "Firm Admin", href: "/admin/dashboard" },
        { label: "User Management", href: "/admin/users" },
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
          Manage your firm's users and their access to the platform. You can invite new users, edit existing users, and deactivate or reactivate users as needed.
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
                onSelect: openEditDialog,
              },
              { type: "separator" },
              user.status === "deactivated"
                ? {
                    key: "activate",
                    label: "Reactivate",
                    icon: CheckCircle2,
                    onSelect: toggleDeactivate,
                  }
                : {
                    key: "deactivate",
                    label: "Deactivate",
                    icon: Ban,
                    destructive: true,
                    onSelect: toggleDeactivate,
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

      <FirmUserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={editingUser}
        onSubmit={handleSave}
        submitting={editSubmitting}
      />
    </DashboardLayout>
  )
}

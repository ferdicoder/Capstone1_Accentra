import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchClients } from "@/hooks/useClients"
import { FirmUsersToolbar } from "@/components/firm/users/firm-users-toolbar"
import { FirmUserTable } from "@/components/firm/users/firm-user-table"
import { FirmUserAvatar } from "@/components/firm/users/firm-user-avatar"
import { FirmUserStatusBadge } from "@/components/firm/users/firm-user-status-badge"
import { ClientTypeBadge } from "@/components/firm/clients/client-type-badge"
import { clientStatusFilterOptions } from "@/components/firm/clients/client-variants"

const clientColumns = [
  {
    key: "client",
    label: "Client",
    render: (client) => (
      <div className="flex min-w-0 items-center gap-3">
        <FirmUserAvatar name={client.name} />
        <p className="min-w-0 truncate text-sm font-medium text-foreground">{client.name || "â€”"}</p>
      </div>
    ),
  },
  {
    key: "business",
    label: "Business",
    render: (client) => (
      <span className="block truncate text-sm text-foreground">{client.businessName || "â€”"}</span>
    ),
  },
  {
    key: "industry",
    label: "Industry",
    render: (client) => (
      <span className="block truncate text-sm text-foreground">{client.industry || "â€”"}</span>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (client) => <ClientTypeBadge type={client.clientType} />,
  },
  {
    key: "status",
    label: "Status",
    render: (client) => <FirmUserStatusBadge status={client.status} />,
  },
]

/**
 * Client list for Firm Admin and Firm Staff. Rows open the Client Detail page,
 * where Firm Admin can edit/deactivate and Firm Staff gets a read-only view.
 */
export default function ClientManagementPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"

  const { clients, isLoading, error } = useFetchClients()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()
    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        [client.name, client.businessName, client.email].some((field) =>
          field?.toLowerCase().includes(query)
        )
      const matchesStatus = !statusFilter || client.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [clients, search, statusFilter])

  const openDetails = (client) => navigate(`${basePath}/clients/${client.id}`)

  usePageMeta({
    title: "Client Management",
    breadcrumbs: [],
  })

  if (isLoading) return <PageSkeleton type="users" />

  const hasNoClients = clients.length === 0

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <p className="text-sm text-muted-foreground">
          Manage and view firm clients and their engagement history.
        </p>
        {error && <span className="text-xs text-destructive">Failed to load clients</span>}
      </div>

      <FirmUsersToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search clients..."
        roleFilter={statusFilter}
        onRoleFilterChange={setStatusFilter}
        roleOptions={clientStatusFilterOptions}
        filterLabel="Status"
        filterHeading="Filter by status"
        allOptionLabel="All statuses"
        resultCount={`${filteredClients.length} of ${clients.length} clients`}
      />

      <FirmUserTable
        users={filteredClients}
        columns={clientColumns}
        equalColumns
        onRowClick={openDetails}
        emptyMessage={hasNoClients ? "No clients yet." : "No clients match your filters."}
        emptyDescription={
          hasNoClients
            ? "Clients appear here once they submit a service request."
            : "Try clearing the search or filters."
        }
      />
    </>
  )
}

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { EngagementList } from "@/components/firm/engagements/engagement-list"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { formatDate } from "@/components/firm/engagements/engagement-variants"

const historyColumns = [
  {
    key: "engagementNumber",
    label: "Engagement No.",
    render: (engagement) => (
      <span className="text-sm font-medium tabular-nums whitespace-nowrap text-foreground">
        {engagement?.engagementNumber}
      </span>
    ),
  },
  {
    key: "serviceName",
    label: "Service",
    render: (engagement) => (
      <span className="line-clamp-1 max-w-56 text-sm text-foreground">{engagement?.serviceName}</span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (engagement) => <EngagementStatusBadge status={engagement?.status} />,
  },
  {
    key: "startDate",
    label: "Started",
    render: (engagement) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {formatDate(engagement?.startDate ?? engagement?.createdAt?.slice(0, 10))}
      </span>
    ),
  },
  {
    key: "targetEndDate",
    label: "Deadline",
    render: (engagement) => (
      <span className="text-sm whitespace-nowrap text-muted-foreground">
        {formatDate(engagement?.targetEndDate)}
      </span>
    ),
  },
]

const formatStatusLabel = (status) =>
  String(status)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

/**
 * Engagement history for one client: summary rows only. Full workflow stays
 * on the Engagement Detail page, reached by clicking a row (`onViewEngagement`).
 *
 * @param {Array} engagements - The client's engagements (current and past).
 * @param {boolean} loading - Shows the shared table loading state.
 * @param {Function} onViewEngagement - (engagement) => void navigation callback.
 */
export function ClientEngagementHistory({ engagements = [], loading = false, onViewEngagement }) {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [search, setSearch] = useState("")

  // Build status options from the data so they always match real values.
  const statusOptions = useMemo(
    () => [...new Set(engagements.map((e) => e?.status).filter(Boolean))],
    [engagements]
  )

  const filteredEngagements = useMemo(() => {
    const query = search.trim().toLowerCase()
    return engagements.filter((engagement) => {
      if (statusFilter && engagement?.status !== statusFilter) return false
      if (!query) return true
      return [engagement?.engagementNumber, engagement?.serviceName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [engagements, statusFilter, search])

  const hasFilters = Boolean(statusFilter || search.trim())

  return (
    <section data-slot="client-engagement-history" className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="text-sm font-semibold text-foreground">Engagement History</h2>
          {!loading && (
            <span className="text-sm text-muted-foreground">
              {filteredEngagements.length}{" "}
              {filteredEngagements.length === 1 ? "engagement" : "engagements"}
              {hasFilters && ` of ${engagements.length}`}
            </span>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative w-full sm:w-56">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search number or service"
              aria-label="Search engagement history"
              className="h-9 w-full rounded-lg border border-input bg-background pr-3 pl-8 text-sm text-foreground"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value)
              setPage(1)
            }}
            aria-label="Filter by status"
            className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground sm:w-auto"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <EngagementList
        engagements={filteredEngagements}
        columns={historyColumns}
        loading={loading}
        emptyMessage={hasFilters ? "No engagements match your filters." : "No engagement history yet."}
        showActions={false}
        onRowClick={onViewEngagement}
        page={page}
        onPageChange={setPage}
      />
    </section>
  )
}
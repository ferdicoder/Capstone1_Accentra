import { EngagementList } from "@/components/firm/engagements/engagement-list"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { formatDate } from "@/components/firm/engagements/engagement-variants"

const historyColumns = [
  {
    key: "engagementNumber",
    label: "Engagement No.",
    render: (engagement) => (
      <span className="text-sm font-medium tabular-nums text-foreground">
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
      <span className="text-sm text-muted-foreground">
        {formatDate(engagement?.startDate ?? engagement?.createdAt?.slice(0, 10))}
      </span>
    ),
  },
  {
    key: "targetEndDate",
    label: "Deadline",
    render: (engagement) => (
      <span className="text-sm text-muted-foreground">{formatDate(engagement?.targetEndDate)}</span>
    ),
  },
]

/**
 * Engagement history for one client: summary rows only. Full workflow stays
 * on the Engagement Detail page, reached by clicking a row (`onViewEngagement`).
 *
 * @param {Array} engagements - The client's engagements (current and past).
 * @param {boolean} loading - Shows the shared table loading state.
 * @param {Function} onViewEngagement - (engagement) => void navigation callback.
 */
export function ClientEngagementHistory({ engagements = [], loading = false, onViewEngagement }) {
  return (
    <section data-slot="client-engagement-history" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-foreground">Engagement History</h2>
        {!loading && (
          <span className="text-sm text-muted-foreground">
            {engagements.length} {engagements.length === 1 ? "engagement" : "engagements"}
          </span>
        )}
      </div>

      <EngagementList
        engagements={engagements}
        columns={historyColumns}
        loading={loading}
        emptyMessage="No engagement history yet."
        showActions={false}
        onRowClick={onViewEngagement}
      />
    </section>
  )
}

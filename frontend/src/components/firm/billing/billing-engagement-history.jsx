import { EngagementList } from "@/components/firm/engagements/engagement-list"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { formatDate } from "@/components/firm/engagements/engagement-variants"

const billingEngagementColumns = [
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
 * Engagements linked to one billing record, shown on the Billing Detail page.
 * Mirrors the summary table used by the Client Detail engagement history.
 */
export function BillingEngagementHistory({ engagements = [], loading = false }) {
  return (
    <section data-slot="billing-engagement-history" className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-foreground">Related Engagements</h2>
        {!loading && (
          <span className="text-sm text-muted-foreground">
            {engagements.length} {engagements.length === 1 ? "engagement" : "engagements"}
          </span>
        )}
      </div>

      <EngagementList
        engagements={engagements}
        columns={billingEngagementColumns}
        loading={loading}
        emptyMessage="No engagements are linked to this billing."
        showActions={false}
      />
    </section>
  )
}

import { useState } from "react"

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
 *
 * Rendered inside its own card, so the list's outer frame is removed (via the
 * list's className) to avoid a card-inside-a-card look. The list grows to fill
 * the card, which keeps the pagination footer pinned to the card's bottom edge
 * when the card is stretched to match its neighbour.
 */
export function BillingEngagementHistory({ engagements = [], loading = false }) {
  const [page, setPage] = useState(1)

  return (
    <section data-slot="billing-engagement-history" className="flex flex-1 flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold text-foreground">Related Engagements</h2>
        {!loading && (
          <span className="text-sm text-muted-foreground">
            {engagements.length} {engagements.length === 1 ? "engagement" : "engagements"}
          </span>
        )}
      </div>

      {/* EngagementList renders the table and its pagination as siblings, so
          this flex column lets the table take the free space and push the
          pagination to the bottom. */}
      <div className="flex flex-1 flex-col gap-3">
        <EngagementList
          engagements={engagements}
          columns={billingEngagementColumns}
          loading={loading}
          emptyMessage="No engagements are linked to this billing."
          showActions={false}
          page={page}
          onPageChange={setPage}
          className="flex-1 rounded-none border-0 bg-transparent shadow-none"
        />
      </div>
    </section>
  )
}
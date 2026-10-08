import { FileText, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getReviewDocuments } from "./engagement-variants"

function StatBadge({ label, count, dotColor }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <span className={cn("size-2 shrink-0 rounded-full", dotColor)} />
      <span className="text-sm text-foreground">{label}</span>
      <span className="ml-auto text-sm font-semibold text-foreground">{count}</span>
    </div>
  )
}

export function ReviewSummaryCard({ engagement, onViewDetails, className }) {
  const documents = engagement?.documents ?? []
  const reviewDocs = getReviewDocuments(engagement)

  const missing = reviewDocs.filter((d) => ["missing", "pending"].includes(d.status)).length
  const forReview = reviewDocs.filter((d) =>
    ["for_review", "in_review", "submitted", "resubmitted"].includes(d.status)
  ).length
  const forRevision = reviewDocs.filter((d) =>
    ["for_revision", "revision_requested", "rejected"].includes(d.status)
  ).length
  const approved = reviewDocs.filter((d) => d.status === "approved").length

  const total = documents.length
  const reviewed = approved + forRevision

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
            <FileText className="size-4 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Document Review Summary</h3>
            <p className="text-xs text-muted-foreground">
              {reviewed} of {total} documents reviewed
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 rounded-lg text-xs"
          onClick={onViewDetails}
        >
          View Details
        </Button>
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
            <Inbox className="size-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatBadge label="Missing" count={missing} dotColor="bg-red-500" />
          <StatBadge label="For Review" count={forReview} dotColor="bg-amber-500" />
          <StatBadge label="For Revision" count={forRevision} dotColor="bg-orange-500" />
          <StatBadge label="Approved" count={approved} dotColor="bg-emerald-500" />
        </div>
      )}
    </div>
  )
}

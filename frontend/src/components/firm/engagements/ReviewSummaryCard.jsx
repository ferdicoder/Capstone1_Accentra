import { FileText, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { getReviewDocuments, documentStatusLabels } from "./engagement-variants"

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

  const submitted = reviewDocs.filter((d) => d.status === "submitted").length
  const inReview = reviewDocs.filter((d) => d.status === "in_review").length
  const revisionRequested = reviewDocs.filter((d) => d.status === "revision_requested").length
  const approved = reviewDocs.filter((d) => d.status === "approved").length
  const pending = documents.filter((d) => d.status === "pending").length

  const total = documents.length
  const reviewed = approved + revisionRequested

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
          <StatBadge label="Submitted" count={submitted} dotColor="bg-emerald-500" />
          <StatBadge label="In Review" count={inReview} dotColor="bg-purple-500" />
          <StatBadge label="Revision" count={revisionRequested} dotColor="bg-amber-500" />
          <StatBadge label="Approved" count={approved} dotColor="bg-emerald-500" />
        </div>
      )}

      {pending > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          {pending} {pending === 1 ? "document" : "documents"} pending upload
        </p>
      )}
    </div>
  )
}

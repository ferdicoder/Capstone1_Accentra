import { FileText } from "lucide-react"

import { cn } from "@/lib/utils"
import { getCategoryLabel } from "@/lib/service-categories"
import { ServiceRequestStatusBadge } from "./service-request-status-badge"

/** Label/value row shared by the request cards on the detail view. */
export function RequestDetailRow({ label, children, className }) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[104px_minmax(0,1fr)] gap-3 py-2.5 text-sm sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-4 lg:grid-cols-[150px_minmax(0,1fr)]",
        className
      )}
    >
      <dt className="min-w-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  )
}

/**
 * Presentational card showing what the client requested and their notes.
 * The client picks a category only; the Admin chooses the template (and so
 * the price) when approving, so no price is shown here.
 */
// eslint-disable-next-line no-unused-vars
export function RequestDetailsCard({ request, showPrice, className, ...props }) {
  return (
    <div
      data-slot="request-details-card"
      className={cn("rounded-xl border border-border bg-card p-4 shadow-sm sm:p-6", className)}
      {...props}
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-forest-900/10 text-forest-900">
          <FileText className="size-4" />
        </div>
        <h2 className="text-sm font-semibold">Request Details</h2>
      </div>

      <dl className="divide-y divide-border/60">
        <RequestDetailRow label="Requested Category">
          <span className="font-medium">{getCategoryLabel(request?.category)}</span>
        </RequestDetailRow>
        <RequestDetailRow label="Status">
          <ServiceRequestStatusBadge status={request?.status} />
        </RequestDetailRow>
        <RequestDetailRow label="Client Notes">
          <p className="text-sm leading-relaxed break-words text-muted-foreground">
            {request?.notes || "—"}
          </p>
        </RequestDetailRow>
      </dl>
    </div>
  )
}
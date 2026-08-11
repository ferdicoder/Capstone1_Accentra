import { Building2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { formatRevenue, formatSubmittedDate } from "./service-request-variants"
import { RequestDetailRow } from "./request-details-card"

/** Presentational card summarizing the client behind a service request. */
export function ClientInfoCard({ request, className, ...props }) {
  return (
    <div
      data-slot="client-info-card"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-forest-900/10 text-forest-900">
          <Building2 className="size-4" />
        </div>
        <h2 className="text-sm font-semibold">Client Information</h2>
      </div>

      <dl className="divide-y divide-border/60">
        <RequestDetailRow label="Company">
          <span className="font-medium">{request?.companyName}</span>
        </RequestDetailRow>
        <RequestDetailRow label="Entity">{request?.entityType}</RequestDetailRow>
        <RequestDetailRow label="Contact">{request?.contactPerson}</RequestDetailRow>
        <RequestDetailRow label="Revenue">
          <span className="font-medium tabular-nums">{formatRevenue(request?.revenue)}</span>
        </RequestDetailRow>
        <RequestDetailRow label="TIN / UEN">
          <span className="tabular-nums">{request?.tin}</span>
        </RequestDetailRow>
        <RequestDetailRow label="Submitted Date">
          {formatSubmittedDate(request?.submittedDate)}
        </RequestDetailRow>
      </dl>
    </div>
  )
}

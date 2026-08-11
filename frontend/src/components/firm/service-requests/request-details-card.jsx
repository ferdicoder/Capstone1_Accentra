import { FileText } from "lucide-react"

import { cn } from "@/lib/utils"

/** Label/value row shared by the request cards on the detail view. */
export function RequestDetailRow({ label, children, className }) {
  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[120px_minmax(0,1fr)] gap-4 py-2.5 text-sm sm:grid-cols-[150px_minmax(0,1fr)]",
        className
      )}
    >
      <dt className="min-w-0 font-medium text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words text-foreground">{children}</dd>
    </div>
  )
}

/** Presentational card showing what the client requested and their notes. */
export function RequestDetailsCard({ request, className, ...props }) {
  return (
    <div
      data-slot="request-details-card"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="mb-5 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-forest-900/10 text-forest-900">
          <FileText className="size-4" />
        </div>
        <h2 className="text-sm font-semibold">Request Details</h2>
      </div>

      <dl className="divide-y divide-border/60">
        <RequestDetailRow label="Requested Service">
          <span className="font-medium">{request?.serviceName}</span>
        </RequestDetailRow>
        <RequestDetailRow label="Client Notes">
          <p className="text-sm leading-relaxed break-words text-muted-foreground">{request?.notes}</p>
        </RequestDetailRow>
      </dl>
    </div>
  )
}

import { cn } from "@/lib/utils"
import { ServiceRequestAvatar } from "./service-request-avatar"
import { getClientFullName } from "./service-request-variants"
import { RequestDetailRow } from "./request-details-card"

/** Presentational card showing the client's account and business registration information. */
export function ClientInfoCard({ request, className, ...props }) {
  const client = request?.client
  const business = request?.business

  return (
    <div
      data-slot="client-info-card"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="mb-5 flex items-center gap-3">
        <ServiceRequestAvatar name={business?.businessName} size="lg" className="shrink-0" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{business?.businessName}</h2>
          <p className="truncate text-xs text-muted-foreground">{business?.businessType}</p>
        </div>
      </div>

      <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Client / Account
      </p>
      <dl className="divide-y divide-border/60">
        <RequestDetailRow label="Client Name">{getClientFullName(client)}</RequestDetailRow>
        <RequestDetailRow label="Contact No.">{client?.contactNo}</RequestDetailRow>
        <RequestDetailRow label="Email">{client?.email}</RequestDetailRow>
      </dl>

      <p className="mt-5 mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Business
      </p>
      <dl className="divide-y divide-border/60">
        <RequestDetailRow label="TIN / UEN">
          <span className="tabular-nums">{business?.tinNo}</span>
        </RequestDetailRow>
        <RequestDetailRow label="Industry">{business?.industry}</RequestDetailRow>
        <RequestDetailRow label="Address">{business?.address}</RequestDetailRow>
      </dl>
    </div>
  )
}

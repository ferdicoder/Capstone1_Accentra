import { cn } from "@/lib/utils"
import { RequestDetailRow } from "@/components/firm/service-requests/request-details-card"
import { ClientTypeBadge } from "./client-type-badge"
import { FirmUserAvatar } from "@/components/firm/users/firm-user-avatar"
import { FirmUserStatusBadge } from "@/components/firm/users/firm-user-status-badge"

/** Renders a label/value row only when the underlying field has a value. */
function OptionalRow({ label, value }) {
  if (!value) return null
  return <RequestDetailRow label={label}>{value}</RequestDetailRow>
}

/**
 * Presentational card with the full client information (single source for
 * these fields; the list only shows a summary). Read-only by design: edit
 * controls live on the page and are only rendered for Firm Admin.
 */
export function ClientDetailsCard({ client, className, ...props }) {
  return (
    <div
      data-slot="client-details-card"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="mb-5 flex items-center gap-3">
        <FirmUserAvatar name={client?.name} size="lg" />
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold">{client?.name}</h2>
          <p className="truncate text-xs text-muted-foreground">{client?.businessName}</p>
        </div>
        <FirmUserStatusBadge status={client?.status} className="ml-auto" />
      </div>

      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Client / Account
          </p>
          <dl className="divide-y divide-border/60">
            <OptionalRow label="Client Name" value={client?.name} />
            <OptionalRow label="Client Type" value={<ClientTypeBadge type={client?.clientType} />} />
            <OptionalRow label="Email" value={client?.email} />
            <OptionalRow label="Contact No." value={client?.contactNo} />
          </dl>
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Business
          </p>
          <dl className="divide-y divide-border/60">
            <OptionalRow label="Business Name" value={client?.businessName} />
            <OptionalRow label="Business Type" value={client?.businessType} />
            <OptionalRow label="Industry" value={client?.industry} />
            <OptionalRow
              label="TIN / UEN"
              value={client?.tinNo && <span className="tabular-nums">{client.tinNo}</span>}
            />
            <OptionalRow label="Address" value={client?.address} />
          </dl>
        </div>
      </div>
    </div>
  )
}

import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { RequestDetailRow } from "@/components/firm/service-requests/request-details-card"
import { formatRevenue } from "@/components/firm/service-requests/service-request-variants"
import { ClientTypeBadge } from "./client-type-badge"
import { FirmUserAvatar } from "@/components/firm/users/firm-user-avatar"
import { FirmUserStatusBadge } from "@/components/firm/users/firm-user-status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clientTypeOptions } from "./client-variants"

/** Renders a label/value row only when the underlying field has a value. */
function OptionalRow({ label, value, editing = false }) {
  if (!value) return null
  return (
    <RequestDetailRow label={label}>
      {editing ? (
        <span className="inline-flex min-h-8 items-center rounded-md bg-muted px-2.5 text-sm text-muted-foreground">
          {value}
        </span>
      ) : (
        value
      )}
    </RequestDetailRow>
  )
}

/** Keeps only digits: one decimal point at most, and at most two decimals. */
function sanitizeFeeInput(value) {
  return value
    .replace(/[^\d.]/g, "")
    .replace(/(\..*)\./g, "$1")
    .replace(/(\.\d{2})\d+/g, "$1")
}

/**
 * Presentational card with the full client information (single source for
 * these fields; the list only shows a summary). Read-only by design: edit
 * controls live on the page and are only rendered for Firm Admin.
 */
export function ClientDetailsCard({
  client,
  editing = false,
  clientType,
  onClientTypeChange,
  retainerFee,
  onRetainerFeeChange,
  retainerFeeRequired = false,
  retainerFeeError = false,
  className,
  ...props
}) {
  const showRetainerFeeRow =
    editing || client?.clientType === "retainer" || client?.retainerFee != null
  return (
    <div
      data-slot="client-details-card"
      className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}
      {...props}
    >
      <div className="mb-5 flex items-center gap-3">
        <FirmUserAvatar name={client?.name} size="lg" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-sm font-semibold">{client?.name}</h2>
            <FirmUserStatusBadge status={client?.status} className="shrink-0" />
          </div>
          <p className="truncate text-xs text-muted-foreground">{client?.businessName}</p>
        </div>
      </div>

      <div className="grid gap-x-10 gap-y-5 lg:grid-cols-2">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Client / Account
          </p>
          <dl className="divide-y divide-border/60">
            <OptionalRow label="Client Name" value={client?.name} editing={editing} />
            <RequestDetailRow label="Client Type">
              {editing ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="outline"
                        className="h-9 w-full justify-between rounded-lg px-3 font-normal sm:max-w-64"
                      />
                    }
                  >
                    {clientTypeOptions.find((option) => option.value === clientType)?.label ?? "Select client type"}
                    <ChevronDown className="size-4 opacity-60" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-40">
                    {clientTypeOptions.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onClick={() => onClientTypeChange?.(option.value)}
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <ClientTypeBadge type={client?.clientType} />
              )}
            </RequestDetailRow>
            {showRetainerFeeRow && (
              <RequestDetailRow label="Retainer Fee">
                {editing ? (
                  <div className="flex flex-col gap-1 sm:max-w-64">
                    <div className="relative">
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground"
                      >
                        ₱
                      </span>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        aria-label="Retainer fee"
                        disabled={clientType !== "retainer"}
                        className={cn("pl-7", retainerFeeError && "border-destructive")}
                        value={retainerFee}
                        onChange={(event) => onRetainerFeeChange?.(sanitizeFeeInput(event.target.value))}
                      />
                    </div>
                    <p
                      className={cn(
                        "text-xs",
                        retainerFeeError ? "text-destructive" : "text-muted-foreground"
                      )}
                    >
                      {clientType !== "retainer"
                        ? "Only retainer clients are charged a retainer fee."
                        : retainerFeeRequired
                          ? "Required for retainer clients."
                          : "Applies only to retainer clients."}
                    </p>
                  </div>
                ) : (
                  <span className="tabular-nums">{formatRevenue(client?.retainerFee)}</span>
                )}
              </RequestDetailRow>
            )}
            <OptionalRow label="Email" value={client?.email} editing={editing} />
            <OptionalRow label="Contact No." value={client?.contactNo} editing={editing} />
          </dl>
        </div>

        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Business
          </p>
          <dl className="divide-y divide-border/60">
            <OptionalRow label="Business Name" value={client?.businessName} editing={editing} />
            <OptionalRow label="Business Type" value={client?.businessType} editing={editing} />
            <OptionalRow label="Industry" value={client?.industry} editing={editing} />
            <OptionalRow
              label="TIN / UEN"
              value={client?.tinNo && <span className="tabular-nums">{client.tinNo}</span>}
              editing={editing}
            />
            <OptionalRow label="Address" value={client?.address} editing={editing} />
          </dl>
        </div>
      </div>
    </div>
  )
}

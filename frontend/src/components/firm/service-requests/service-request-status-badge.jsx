import { cn } from "@/lib/utils"
import { statusBadgeStyles, statusDotStyles } from "./service-request-variants"

const defaultStatusLabels = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
}

/** Presentational pill that renders a service request's status with a colored dot. */
export function ServiceRequestStatusBadge({
  status,
  statusLabels,
  showDot = true,
  className,
  ...props
}) {
  const labels = { ...defaultStatusLabels, ...statusLabels }
  const value = typeof status === "string" ? status.toLowerCase() : status
  const label = labels[value] ?? status ?? "Unknown"

  return (
    <span
      data-slot="service-request-status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        statusBadgeStyles[value] ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            statusDotStyles[value] ?? "bg-muted-foreground"
          )}
        />
      )}
      {label}
    </span>
  )
}

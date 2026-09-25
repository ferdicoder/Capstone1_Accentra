import { cn } from "@/lib/utils"
import { statusBadgeStyles, statusDotStyles } from "./engagement-variants"

const defaultStatusLabels = {
  document_collection: "Document Collection",
  for_validation: "For Validation",
  in_progress: "In Progress",
  for_approval: "For Approval",
  payment: "Payment",
  completed: "Completed",
  cancelled: "Cancelled",
}

export function EngagementStatusBadge({
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
      data-slot="engagement-status-badge"
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

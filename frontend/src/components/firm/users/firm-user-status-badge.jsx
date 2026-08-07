import { cn } from "@/lib/utils"
import { statusBadgeStyles, statusDotStyles } from "./firm-user-variants"

const defaultStatusLabels = {
  active: "Active",
  inactive: "Inactive",
  deactivated: "Deactivated",
}

/**
 * Presentational pill that renders a user's account status with a colored dot.
 * Status is derived from system activity — never manually assigned.
 *
 * @param {string} status - Raw status value, e.g. "active" or "deactivated".
 * @param {Object} statusLabels - Optional { value: label } overrides for display text.
 * @param {boolean} showDot - Whether to show the leading status dot. Default true.
 * @param {string} className - Extra classes merged onto the badge.
 */
export function FirmUserStatusBadge({
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
      data-slot="firm-user-status-badge"
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

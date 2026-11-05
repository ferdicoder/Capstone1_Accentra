import { cn } from "@/lib/utils"
import {
  billingStatusLabels,
  isFinalBillingStatus,
  statusBadgeStyles,
  statusDotStyles,
} from "./billing-variants"

/**
 * Presentational pill that renders a billing status with a colored dot.
 * Same visual system as FirmUserStatusBadge / EngagementStatusBadge.
 */
export function BillingStatusBadge({ status, showDot = true, className, ...props }) {
  const value = typeof status === "string" ? status.toLowerCase() : status
  const label = billingStatusLabels[value] ?? status ?? "Unknown"
  const isLocked = isFinalBillingStatus(value)

  return (
    <span
      data-slot="billing-status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        isLocked && value !== "paid"
          ? "bg-muted text-muted-foreground ring-border dark:bg-muted/50"
          : statusBadgeStyles[value] ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
      {...props}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={cn(
            "size-1.5 shrink-0 rounded-full",
            isLocked && value !== "paid"
              ? "bg-muted-foreground"
              : statusDotStyles[value] ?? "bg-muted-foreground"
          )}
        />
      )}
      {label}
    </span>
  )
}

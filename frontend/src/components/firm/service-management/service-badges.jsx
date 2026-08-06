import { cn } from "@/lib/utils"
import {
  categoryBadgeStyles,
  statusBadgeStyles,
  statusDotStyles,
} from "./service-management-variants"

/**
 * Presentational pill that renders a service's status with a colored dot.
 * Status: active = published, inactive = draft, deactivated = off.
 */
export function ServiceStatusBadge({ status, statusLabels, showDot = true, className, ...props }) {
  const labels = { active: "Active", inactive: "Inactive", deactivated: "Deactivated", ...statusLabels }
  const value = typeof status === "string" ? status.toLowerCase() : status
  const label = labels[value] ?? status ?? "Unknown"

  return (
    <span
      data-slot="service-status-badge"
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

/** Presentational pill that renders a service's category with a distinct color. */
export function ServiceCategoryBadge({ category, categoryLabels, className, ...props }) {
  const labels = {
    "tax-filing": "Tax Filing",
    "business-registration": "Business Registration",
    ...categoryLabels,
  }
  const value = typeof category === "string" ? category.toLowerCase() : category
  const label = labels[value] ?? category ?? "Unknown"

  return (
    <span
      data-slot="service-category-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        categoryBadgeStyles[value] ?? "bg-muted text-muted-foreground ring-border",
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}

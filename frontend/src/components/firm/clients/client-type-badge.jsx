import { cn } from "@/lib/utils"
import { DEFAULT_CLIENT_TYPE, clientTypeBadgeStyles, clientTypeLabels } from "./client-variants"

/**
 * Presentational pill for a client's type ("Retainer" or "Non-retainer").
 * Same pill shape as the User Management role badge.
 */
export function ClientTypeBadge({ type, className, ...props }) {
  const value = typeof type === "string" ? type.toLowerCase() : DEFAULT_CLIENT_TYPE
  const label = clientTypeLabels[value] ?? clientTypeLabels[DEFAULT_CLIENT_TYPE]

  return (
    <span
      data-slot="client-type-badge"
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        clientTypeBadgeStyles[value] ?? clientTypeBadgeStyles[DEFAULT_CLIENT_TYPE],
        className
      )}
      {...props}
    >
      {label}
    </span>
  )
}

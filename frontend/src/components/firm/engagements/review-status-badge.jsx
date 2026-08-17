import { cn } from "@/lib/utils"
import { getDocumentStatusStyles, getDocumentStatusDots, documentStatusLabels } from "./engagement-variants"

export function ReviewStatusBadge({ status, className, ...props }) {
  const label = documentStatusLabels[status] ?? status ?? "Unknown"

  return (
    <span
      data-slot="review-status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset",
        getDocumentStatusStyles(status),
        className
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", getDocumentStatusDots(status))}
      />
      {label}
    </span>
  )
}

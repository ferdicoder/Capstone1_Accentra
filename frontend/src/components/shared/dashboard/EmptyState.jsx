import { AlertTriangle } from "lucide-react"

import { cn } from "@/lib/utils"

export function EmptyState({
  icon: Icon,
  title,
  children,
  positive = false,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1.5 px-4 text-center",
        compact ? "py-6" : "py-10"
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-full",
            positive
              ? "bg-emerald-50 text-emerald-600"
              : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      )}
      <p className="mt-1 text-sm font-medium">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{children}</p>
    </div>
  )
}

// Shown instead of the empty state when a request failed, so an error is never
// mistaken for "nothing to show".
export function InlineError({ showIcon = true }) {
  return (
    <div
      role="alert"
      className="flex items-center gap-2 px-4 py-6 text-sm text-red-700"
    >
      {showIcon && <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />}
      This section could not be loaded. Refresh the page to try again.
    </div>
  )
}
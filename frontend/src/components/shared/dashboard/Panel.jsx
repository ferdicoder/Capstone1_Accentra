import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { focusRing } from "./styles"

export function Panel({
  title,
  description,
  count,
  to,
  linkLabel = "View all",
  showLinkIcon = true,
  className,
  children,
}) {
  return (
    <section
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border bg-background shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b bg-muted/30 px-4 py-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {typeof count === "number" && count > 0 && (
              <span className="rounded-full bg-background px-1.5 py-0.5 text-xs font-medium tabular-nums text-muted-foreground ring-1 ring-border">
                {count}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {to && (
          <Link
            to={to}
            className={cn(
              "inline-flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-xs font-medium text-emerald-700 hover:underline",
              focusRing
            )}
          >
            {linkLabel}
            {showLinkIcon && <ArrowRight className="size-3" aria-hidden="true" />}
          </Link>
        )}
      </div>
      {children}
    </section>
  )
}

// "View N more" row at the bottom of a panel that has hidden rows.
export function MoreLink({ to, count, showIcon = true }) {
  return (
    <Link
      to={to}
      className={cn(
        "mt-auto flex items-center justify-center gap-1 border-t px-4 py-3 text-xs font-medium text-emerald-700 transition-colors hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
      )}
    >
      View {count} more
      {showIcon && <ArrowRight className="size-3" aria-hidden="true" />}
    </Link>
  )
}
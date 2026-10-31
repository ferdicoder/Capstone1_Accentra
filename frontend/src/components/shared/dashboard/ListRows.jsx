import { Link } from "react-router-dom"
import { AlertTriangle, ArrowRight, ChevronRight, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge, IconChip } from "./Badge"
import { focusRing, rowCard } from "./styles"

// Whole row is a link. Same markup the client dashboard uses for billing and
// engagement rows. `trailing` is the text on the right (e.g. an amount).
export function ListRowLink({
  to,
  icon,
  iconTone,
  title,
  subtitle,
  urgent = false,
  badge,
  trailing,
}) {
  return (
    <li>
      <Link to={to} className={cn(rowCard, focusRing)}>
        <div className="flex min-w-0 items-start gap-3">
          <IconChip icon={icon} tone={iconTone} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="truncate text-sm font-medium">{title}</p>
            {subtitle && (
              <p
                className={cn(
                  "flex items-center gap-1 text-xs",
                  urgent ? "font-medium text-red-700" : "text-muted-foreground"
                )}
              >
                {urgent ? (
                  <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
                ) : (
                  <Clock className="size-3 shrink-0" aria-hidden="true" />
                )}
                {subtitle}
              </p>
            )}
            {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {trailing && (
            <span className="text-sm font-semibold tabular-nums">{trailing}</span>
          )}
          <ChevronRight
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </div>
      </Link>
    </li>
  )
}

// Row with a separate action button on the right (same layout as the client
// "Documents to Submit" rows). Use when the row itself is not the click target.
export function ListRowAction({
  icon,
  iconTone,
  title,
  subtitle,
  badge,
  actionLabel,
  actionTo,
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-background p-4 transition-all hover:border-emerald-200 hover:shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <IconChip icon={icon} tone={iconTone} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="wrap-break-word text-sm font-medium">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
        </div>
      </div>
      <Link
        to={actionTo}
        className={cn(
          "group/btn inline-flex w-fit shrink-0 items-center gap-1 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 xl:self-end",
          focusRing
        )}
      >
        {actionLabel}
        <ArrowRight
          className="size-3 transition-transform group-hover/btn:translate-x-0.5"
          aria-hidden="true"
        />
      </Link>
    </li>
  )
}

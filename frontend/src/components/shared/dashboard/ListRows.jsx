import { Link } from "react-router-dom"
import { AlertTriangle, ArrowRight, ChevronRight } from "lucide-react"

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
                  "text-xs",
                  urgent ? "font-medium text-red-700" : "text-muted-foreground"
                )}
              >
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
// Pass `actionTo` for a link, or `onAction` for a button (e.g. open a dialog).
export function ListRowAction({
  icon,
  iconTone,
  title,
  subtitle,
  badge,
  warning,
  actionLabel,
  actionTo,
  onAction,
  actionDisabled = false,
}) {
  const actionClass = cn(
    "group/btn inline-flex w-fit shrink-0 items-center gap-1 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium transition-colors xl:self-end",
    actionDisabled
      ? "cursor-not-allowed opacity-50"
      : "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
    focusRing
  )
  const actionContent = (
    <>
      {actionLabel}
      <ArrowRight
        className="size-3 transition-transform group-hover/btn:translate-x-0.5"
        aria-hidden="true"
      />
    </>
  )
  return (
    <li className="flex flex-col gap-3 rounded-xl border bg-background p-4 transition-all hover:border-emerald-200 hover:shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <IconChip icon={icon} tone={iconTone} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <p className="break-words text-sm font-medium">{title}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {warning && (
            <p className="flex items-center gap-1 text-xs font-medium text-red-700">
              <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
              {warning}
            </p>
          )}
          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
        </div>
      </div>
      {onAction || actionDisabled ? (
        <button
          type="button"
          onClick={onAction}
          disabled={actionDisabled}
          title={actionDisabled ? warning : undefined}
          className={actionClass}
        >
          {actionContent}
        </button>
      ) : (
        <Link to={actionTo} className={actionClass}>
          {actionContent}
        </Link>
      )}
    </li>
  )
}

// Row that opens a page when clicked AND carries its own action buttons.
// The title is a "stretched" link (it covers the whole row), and the buttons sit
// above it, so there is no button nested inside a link.
// actions: [{ label, onClick, disabled, reason }]; `reason` is shown as a
// tooltip when the action is disabled.
export function ListRowWithActions({
  to,
  icon,
  iconTone,
  title,
  subtitle,
  badge,
  warning,
  actions = [],
}) {
  return (
    <li className="relative flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-4 transition-all hover:border-emerald-200 hover:bg-muted/40 hover:shadow-sm">
      <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
        <IconChip icon={icon} tone={iconTone} />
        <div className="flex min-w-0 flex-col gap-1.5">
          <Link
            to={to}
            className={cn(
              "break-words text-sm font-medium after:absolute after:inset-0 after:rounded-xl",
              focusRing
            )}
          >
            {title}
          </Link>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {warning && (
            <p className="flex items-center gap-1 text-xs font-medium text-red-700">
              <AlertTriangle className="size-3 shrink-0" aria-hidden="true" />
              {warning}
            </p>
          )}
          {badge && <Badge tone={badge.tone}>{badge.label}</Badge>}
        </div>
      </div>
      {actions.length > 0 && (
        <div className="relative z-10 ml-auto flex shrink-0 flex-wrap items-center gap-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              title={action.disabled ? action.reason : undefined}
              className={cn(
                "group/btn inline-flex w-fit shrink-0 items-center gap-1 rounded-full border bg-background px-3.5 py-1.5 text-xs font-medium transition-colors",
                action.disabled
                  ? "cursor-not-allowed opacity-50"
                  : "hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
                focusRing
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </li>
  )
}
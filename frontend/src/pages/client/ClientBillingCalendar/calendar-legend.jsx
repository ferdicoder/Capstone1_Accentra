import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"

/**
 * Legend that doubles as a filter. Clicking a type hides or shows its events
 * on the grid and the agenda. "All" shows every type again.
 *
 * @param {Object} eventTypes - { [type]: { label, chip, dot, icon? } }
 * @param {Object} counts - { [type]: number } events of that type in the visible period.
 * @param {Array} hiddenTypes - Types currently hidden.
 * @param {Function} onToggle - (type: string) => void
 * @param {Function} onShowAll - () => void
 * @param {boolean} filtersActive - Any filter or search is on.
 * @param {Function} onClear - () => void, clears every filter.
 */
export function CalendarLegend({
  eventTypes = {},
  counts = {},
  hiddenTypes = [],
  onToggle,
  onShowAll,
  filtersActive = false,
  onClear,
  className,
  ...props
}) {
  const allShown = hiddenTypes.length === 0

  return (
    <div
      data-slot="calendar-legend"
      role="group"
      aria-label="Filter by status"
      className={cn("flex flex-wrap items-center gap-2", className)}
      {...props}
    >
      <button
        type="button"
        onClick={onShowAll}
        aria-pressed={allShown}
        className={cn(
          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
          focusRing,
          allShown
            ? "border-emerald-700 bg-emerald-700 text-white"
            : "bg-background hover:bg-muted/40"
        )}
      >
        All
      </button>

      {Object.keys(eventTypes).map((type) => {
        const config = eventTypes[type]
        const Icon = config.icon
        const isHidden = hiddenTypes.includes(type)
        const count = counts[type] ?? 0

        return (
          <button
            key={type}
            type="button"
            onClick={() => onToggle?.(type)}
            aria-pressed={!isHidden}
            aria-label={`${config.label}: ${count} in view`}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs font-medium transition-opacity hover:bg-muted/40",
              focusRing,
              isHidden && "opacity-50"
            )}
          >
            {Icon ? (
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full border",
                  config.chip
                )}
              >
                <Icon className="size-3" aria-hidden="true" />
              </span>
            ) : (
              <span className={cn("size-2 rounded-full", config.dot)} />
            )}
            <span className={cn(isHidden && "line-through")}>
              {config.label}
            </span>
            <span className="text-muted-foreground">{count}</span>
          </button>
        )
      })}

      {filtersActive && onClear && (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-emerald-700 hover:underline",
            focusRing
          )}
        >
          <X className="size-3" aria-hidden="true" />
          Clear filters
        </button>
      )}
    </div>
  )
}
import { cn } from "@/lib/utils"

/**
 * Compact summary cards shown above the calendar.
 *
 * An item with `filterType` becomes a button that filters the calendar.
 *
 * @param {Array} items - [{ label, value, hint, filterType?, valueClass? }]
 * @param {string} caption - Says which records the cards count, e.g. "All billing records".
 * @param {string} activeLabel - Label of the card whose filter is on.
 * @param {Function} onSelect - (item) => void, called when a filter card is clicked.
 */
export function CalendarSummaryCards({
  items = [],
  caption,
  activeLabel,
  onSelect,
  className,
  ...props
}) {
  if (items.length === 0) return null

  const hasFilterCards = Boolean(onSelect) && items.some((i) => i.filterType)
  const captionText = [caption, hasFilterCards && "Select a card to filter the calendar"]
    .filter(Boolean)
    .join(" · ")

  return (
    <div
      data-slot="calendar-summary-cards"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    >
      {captionText && (
        <p className="text-xs text-muted-foreground">{captionText}</p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map((item) => {
          const interactive = Boolean(onSelect && item.filterType)
          const active = interactive && activeLabel === item.label

          const body = (
            <>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p
                className={cn(
                  "mt-1 text-2xl font-semibold text-foreground",
                  item.valueClass
                )}
              >
                {item.value}
              </p>
              {item.hint && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.hint}
                </p>
              )}
            </>
          )

          if (!interactive) {
            return (
              <div
                key={item.label}
                className="rounded-xl border bg-background p-4"
              >
                {body}
              </div>
            )
          }

          return (
            <button
              key={item.label}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(item)}
              className={cn(
                "rounded-xl border bg-background p-4 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
                active && "border-emerald-500 ring-1 ring-emerald-500"
              )}
            >
              {body}
            </button>
          )
        })}
      </div>
    </div>
  )
}
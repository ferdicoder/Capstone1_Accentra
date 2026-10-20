import { cn } from "@/lib/utils"
import { EventChip } from "./calendar-event-chip"
import { DAY_FORMAT, pluralize, toKey } from "./calendar-utils"

/**
 * One day in the month grid.
 *
 * Clicking an event chip opens that event (onOpenEvent). Clicking the cell or
 * the date number selects the day. Only the selected day is a tab stop;
 * arrow keys move between days (handled by EventCalendar).
 *
 * @param {Date} date
 * @param {Array} events - Events on this day (already filtered and sorted).
 * @param {Object} eventTypes - { [type]: { label, chip, dot, icon? } }
 * @param {boolean} isInMonth - False for greyed-out days of other months.
 * @param {boolean} isToday
 * @param {boolean} isSelected
 * @param {Function} onSelect - (date: Date) => void
 * @param {Function} onOpenEvent - (event) => void
 */
export function CalendarDayCell({
  date,
  events = [],
  eventTypes = {},
  isInMonth = true,
  isToday = false,
  isSelected = false,
  onSelect,
  onOpenEvent,
}) {
  const handleChip = (event) => {
    onSelect?.(date)
    onOpenEvent?.(event)
  }

  return (
    <div
      onClick={() => onSelect?.(date)}
      className={cn(
        "flex min-h-[72px] cursor-pointer flex-col gap-1 bg-background p-1.5 transition-colors hover:bg-muted/40 sm:min-h-[104px] sm:p-2",
        !isInMonth && "bg-muted/20 text-muted-foreground/60",
        isSelected && "relative z-10 ring-2 ring-inset ring-emerald-500"
      )}
    >
      <button
        type="button"
        data-day-key={toKey(date)}
        tabIndex={isSelected ? 0 : -1}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(date)
        }}
        aria-label={`${DAY_FORMAT.format(date)}, ${pluralize(events.length, "item")}`}
        aria-pressed={isSelected}
        aria-current={isToday ? "date" : undefined}
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1",
          isToday && "bg-emerald-700 text-white"
        )}
      >
        {date.getDate()}
      </button>

      {/* Small screens: dots only. The List view and the agenda carry the details. */}
      <div className="flex flex-wrap items-center gap-0.5 sm:hidden" aria-hidden="true">
        {events.slice(0, 4).map((event) => (
          <span
            key={event.id}
            className={cn("size-1.5 rounded-full", eventTypes[event.type]?.dot)}
          />
        ))}
        {events.length > 4 && (
          <span className="text-[10px] text-muted-foreground">
            +{events.length - 4}
          </span>
        )}
      </div>

      {/* sm and up: clickable chips with a status icon */}
      <div className="hidden flex-col gap-1 sm:flex">
        {events.slice(0, 2).map((event) => (
          <EventChip
            key={event.id}
            event={event}
            config={eventTypes[event.type]}
            onClick={handleChip}
          />
        ))}
        {events.length > 2 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onSelect?.(date)
            }}
            className="rounded px-1 text-left text-[11px] font-medium text-muted-foreground hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            +{events.length - 2} more
          </button>
        )}
      </div>
    </div>
  )
}
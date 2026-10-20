import { cn } from "@/lib/utils"
import { EventChip, StatusIcon } from "./calendar-event-chip"
import {
  DAY_FORMAT,
  WEEKDAYS,
  formatCurrency,
  toKey,
} from "./calendar-utils"

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-1"

/**
 * Week view: 7 columns on tablet and desktop, one row per day on phones.
 * Shows every event of the day (no "+N more").
 */
export function CalendarWeekView({
  days,
  eventsByDay,
  eventTypes,
  todayKey,
  selectedKey,
  onSelect,
  onOpenEvent,
}) {
  return (
    <section
      aria-label="Week view"
      className="overflow-hidden rounded-xl border bg-background"
    >
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-7">
        {days.map((date) => {
          const key = toKey(date)
          const dayEvents = eventsByDay[key] ?? []
          const isToday = key === todayKey
          const isSelected = key === selectedKey

          return (
            <div
              key={key}
              onClick={() => onSelect(date)}
              className={cn(
                "flex min-h-[72px] cursor-pointer flex-col gap-2 bg-background p-2 hover:bg-muted/40 sm:min-h-[220px]",
                isSelected && "relative z-10 ring-2 ring-inset ring-emerald-500"
              )}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                aria-current={isToday ? "date" : undefined}
                aria-label={DAY_FORMAT.format(date)}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(date)
                }}
                className={cn("flex items-center gap-2 rounded text-left", focusRing)}
              >
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  {WEEKDAYS[date.getDay()]}
                </span>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    isToday && "bg-emerald-700 text-white"
                  )}
                >
                  {date.getDate()}
                </span>
              </button>

              <div className="flex flex-col gap-1">
                {dayEvents.map((event) => (
                  <EventChip
                    key={event.id}
                    event={event}
                    config={eventTypes[event.type]}
                    className="py-1"
                    onClick={(item) => {
                      onSelect(date)
                      onOpenEvent?.(item)
                    }}
                  />
                ))}
                {dayEvents.length === 0 && (
                  <span className="text-[11px] text-muted-foreground/70">
                    No items
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/**
 * List view: every event of the visible month, grouped by day.
 * Best layout for phones and for screen readers.
 */
export function CalendarListView({
  groups,
  eventTypes,
  todayKey,
  onSelectDay,
  onOpenEvent,
}) {
  return (
    <section aria-label="Agenda list" className="flex flex-col gap-5">
      {groups.map((group) => {
        const key = toKey(group.date)
        return (
          <div key={key}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              {DAY_FORMAT.format(group.date)}
              {key === todayKey && (
                <span className="rounded-full bg-emerald-700 px-2 py-0.5 text-[11px] font-medium text-white">
                  Today
                </span>
              )}
            </h2>
            <ul className="flex flex-col gap-2">
              {group.events.map((event) => {
                const config = eventTypes[event.type] ?? {}
                return (
                  <li key={event.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectDay(group.date)
                        onOpenEvent?.(event)
                      }}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 rounded-lg border bg-background p-3 text-left transition-colors hover:bg-muted/40",
                        focusRing
                      )}
                    >
                      <span className="min-w-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                            config.chip
                          )}
                        >
                          <StatusIcon config={config} />
                          {config.label ?? event.type}
                        </span>
                        <span className="mt-1.5 block break-words text-sm font-medium">
                          {event.title}
                        </span>
                        {event.description && (
                          <span className="block text-xs text-muted-foreground">
                            {event.description}
                          </span>
                        )}
                      </span>
                      {event.amount != null && (
                        <span className="shrink-0 text-sm font-semibold">
                          {formatCurrency(event.amount)}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
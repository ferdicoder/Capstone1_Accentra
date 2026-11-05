import { ArrowRight, CalendarDays } from "lucide-react"

import { cn } from "@/lib/utils"
import { StatusIcon } from "./calendar-event-chip"
import { DAY_FORMAT, formatCurrency, pluralize } from "./calendar-utils"

function AgendaItem({ event, eventTypes, onOpenEvent }) {
  const config = eventTypes[event.type] ?? {}

  return (
    <li className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
            config.chip
          )}
        >
          <StatusIcon config={config} />
          {config.label ?? event.type}
        </span>
        {event.amount != null && (
          <span className="text-sm font-semibold">
            {formatCurrency(event.amount)}
          </span>
        )}
      </div>

      <p className="mt-2 break-words text-sm font-medium">{event.title}</p>
      {event.description && (
        <p className="text-xs text-muted-foreground">{event.description}</p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground">
          {event.reference ?? ""}
        </span>
        {event.href && onOpenEvent && (
          <button
            type="button"
            onClick={() => onOpenEvent(event)}
            className="inline-flex shrink-0 items-center gap-1 rounded px-1 py-1 text-xs font-medium text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            {event.linkLabel ?? "Open"}
            <ArrowRight className="size-3" aria-hidden="true" />
          </button>
        )}
      </div>
    </li>
  )
}

/**
 * Side panel listing everything scheduled on the selected day.
 *
 * @param {Date} date - Selected day.
 * @param {Array} events - Events on that day.
 * @param {Object} eventTypes - { [type]: { label, chip, dot, icon? } }
 * @param {Function} onOpenEvent - (event) => void. Called by the link button.
 * @param {string} emptyMessage - Shown when the day has no events.
 */
export function CalendarAgenda({
  date,
  events = [],
  eventTypes = {},
  onOpenEvent,
  emptyMessage = "Nothing scheduled on this day.",
  className,
  ...props
}) {
  return (
    <section
      data-slot="calendar-agenda"
      aria-label="Selected day"
      className={cn("rounded-xl border bg-background p-5", className)}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <CalendarDays className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">{DAY_FORMAT.format(date)}</h2>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {events.length === 0
              ? "Nothing scheduled"
              : pluralize(events.length, "item")}
          </p>
        </div>
      </div>

      {events.length === 0 ? (
        <p className="mt-5 rounded-lg bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {events.map((event) => (
            <AgendaItem
              key={event.id}
              event={event}
              eventTypes={eventTypes}
              onOpenEvent={onOpenEvent}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
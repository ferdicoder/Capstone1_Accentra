import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CalendarDays, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { CalendarAgenda } from "./calendar-agenda"
import { CalendarDayCell } from "./calendar-day-cell"
import { CalendarLegend } from "./calendar-legend"
import { CalendarSummaryCards } from "./calendar-summary-cards"
import { CalendarToolbar } from "./calendar-toolbar"
import { CalendarListView, CalendarWeekView } from "./calendar-views"
import {
  MONTH_FORMAT,
  SHORT_DAY_FORMAT,
  WEEKDAYS,
  addDays,
  buildMonthDays,
  buildMonthGrid,
  buildWeek,
  formatWeekRange,
  fromKey,
  isSameMonth,
  shiftMonth,
  toKey,
  useToday,
} from "./calendar-utils"

const VIEWS = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "list", label: "List" },
]

const toArray = (value) => (Array.isArray(value) ? value : [value])

function CalendarSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <span className="sr-only" role="status">
        Loading calendar…
      </span>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border bg-muted/40"
          />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-xl border bg-muted/40" />
    </div>
  )
}

/**
 * Reusable calendar. Every role (Client, Billing Officer, Firm Admin,
 * Firm Staff) uses this same component, so they all share one design.
 * The page only supplies the data and the labels.
 *
 * Event shape:
 *   { id, type, date: Date, title, description?, amount?, reference?, href?,
 *     linkLabel?, searchText? }
 *
 * eventTypes shape (key order is also the sort order within a day):
 *   { [type]: { label, chip, dot, icon? } }
 *   chip -> Tailwind classes, e.g. "bg-red-50 text-red-700 border-red-200"
 *   dot  -> Tailwind class, e.g. "bg-red-500"
 *   icon -> optional lucide icon so status is not shown by color alone
 *
 * @param {Array} events - All events (any month).
 * @param {Object} eventTypes - Colors, labels and icons per event type.
 * @param {string} title - Page heading.
 * @param {string} description - Text under the heading.
 * @param {Array|Function} summaryItems - [{ label, value, hint, filterType?, valueClass? }]
 *        or (monthEvents, allEvents) => items. `filterType` (string or array)
 *        makes the card filter the calendar when clicked.
 * @param {string} summaryCaption - Says which records the cards count.
 * @param {Function} onOpenEvent - (event) => void. Called when an event is clicked.
 * @param {string} emptyMessage - Agenda text when the selected day is empty.
 * @param {string} emptyTitle - Heading when there are no events at all.
 * @param {string} emptyDescription - Text when there are no events at all.
 * @param {boolean} loading - Shows a loading skeleton.
 * @param {Error|string} error - Shows an error with an optional retry button.
 * @param {Function} onRetry - () => void. Shows "Try again" in the error state.
 * @param {boolean} searchable - Shows a search box.
 * @param {string} searchPlaceholder
 * @param {ReactNode} toolbarExtras - Extra filter controls next to the search box.
 * @param {ReactNode} notice - Content shown between the toolbar and the summary cards.
 * @param {boolean} externalFiltersActive - A page-level filter (in toolbarExtras) is on.
 * @param {Function} onClearExternalFilters - () => void, resets the page-level filter.
 */
export function EventCalendar({
  events = [],
  eventTypes = {},
  title,
  description,
  summaryItems,
  summaryCaption,
  onOpenEvent,
  emptyMessage,
  emptyTitle = "Nothing scheduled yet",
  emptyDescription = "Dates will appear here once they are recorded.",
  loading = false,
  error,
  onRetry,
  searchable = false,
  searchPlaceholder = "Search",
  toolbarExtras,
  notice,
  externalFiltersActive = false,
  onClearExternalFilters,
  className,
}) {
  const today = useToday()
  const todayKey = toKey(today)
  const gridRef = useRef(null)
  const focusRequest = useRef(false)

  const [viewDate, setViewDate] = useState(() => today)
  const [selectedKey, setSelectedKey] = useState(todayKey)
  const [hiddenTypes, setHiddenTypes] = useState([])
  const [query, setQuery] = useState("")
  // Phones start in the list view because a 7-column grid is too tight.
  const [view, setView] = useState(() =>
    typeof window !== "undefined" &&
    window.matchMedia?.("(max-width: 639px)").matches
      ? "list"
      : "month"
  )

  const typeOrder = useMemo(() => Object.keys(eventTypes), [eventTypes])
  const normalizedQuery = query.trim().toLowerCase()

  // 1. Search
  const searchedEvents = useMemo(() => {
    if (!normalizedQuery) return events
    return events.filter((event) =>
      [
        event.title,
        event.description,
        event.reference,
        event.searchText,
        eventTypes[event.type]?.label,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery)
    )
  }, [events, normalizedQuery, eventTypes])

  // 2. Legend filter. This is what the grid, week, list and agenda draw.
  const visibleEvents = useMemo(
    () => searchedEvents.filter((event) => !hiddenTypes.includes(event.type)),
    [searchedEvents, hiddenTypes]
  )

  const eventsByDay = useMemo(() => {
    const map = {}
    for (const event of visibleEvents) {
      const key = toKey(event.date)
      if (!map[key]) map[key] = []
      map[key].push(event)
    }
    for (const key of Object.keys(map)) {
      map[key].sort(
        (a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type)
      )
    }
    return map
  }, [visibleEvents, typeOrder])

  const weekDays = useMemo(() => buildWeek(viewDate), [viewDate])
  const gridDays = useMemo(() => buildMonthGrid(viewDate), [viewDate])

  const isInPeriod = useMemo(() => {
    if (view === "week") {
      const keys = new Set(weekDays.map(toKey))
      return (date) => keys.has(toKey(date))
    }
    return (date) => isSameMonth(date, viewDate)
  }, [view, weekDays, viewDate])

  const periodLabel =
    view === "week" ? formatWeekRange(viewDate) : MONTH_FORMAT.format(viewDate)

  const periodEvents = useMemo(
    () => visibleEvents.filter((event) => isInPeriod(event.date)),
    [visibleEvents, isInPeriod]
  )

  const countsByType = useMemo(() => {
    const counts = {}
    for (const event of searchedEvents) {
      if (!isInPeriod(event.date)) continue
      counts[event.type] = (counts[event.type] ?? 0) + 1
    }
    return counts
  }, [searchedEvents, isInPeriod])

  // Summary cards ignore search and legend filters.
  const monthEvents = useMemo(
    () => events.filter((event) => isSameMonth(event.date, viewDate)),
    [events, viewDate]
  )
  const summary = useMemo(() => {
    if (typeof summaryItems === "function") {
      return summaryItems(monthEvents, events)
    }
    return summaryItems ?? []
  }, [summaryItems, monthEvents, events])

  // A summary card is "on" when the legend shows exactly its types.
  const hiddenKey = [...hiddenTypes].sort().join("|")
  const activeCard = summary.find(
    (item) =>
      item.filterType &&
      typeOrder
        .filter((t) => !toArray(item.filterType).includes(t))
        .sort()
        .join("|") === hiddenKey
  )?.label

  const filtersActive =
    hiddenTypes.length > 0 || normalizedQuery !== "" || externalFiltersActive

  const listGroups = useMemo(
    () =>
      Object.keys(eventsByDay)
        .filter((key) => isSameMonth(fromKey(key), viewDate))
        .sort()
        .map((key) => ({ date: fromKey(key), events: eventsByDay[key] })),
    [eventsByDay, viewDate]
  )

  // When the period is empty, offer a jump to the closest day that has events.
  const nearestEvent = useMemo(() => {
    if (periodEvents.length > 0 || visibleEvents.length === 0) return null
    const anchor =
      view === "week"
        ? weekDays[3]
        : new Date(viewDate.getFullYear(), viewDate.getMonth(), 15)
    return visibleEvents.reduce((best, event) =>
      Math.abs(event.date - anchor) < Math.abs(best.date - anchor)
        ? event
        : best
    )
  }, [periodEvents, visibleEvents, view, weekDays, viewDate])

  const selectedDate = fromKey(selectedKey)
  const selectedEvents = eventsByDay[selectedKey] ?? []

  const errorMessage = typeof error === "string" ? error : error?.message

  // --- Navigation -----------------------------------------------------------

  // Moves to a new period and selects today, else the first day with events.
  const moveTo = (anchor) => {
    const days = view === "week" ? buildWeek(anchor) : buildMonthDays(anchor)
    const keys = days.map(toKey)
    const pick = keys.includes(todayKey)
      ? todayKey
      : (keys.find((key) => eventsByDay[key]?.length) ?? keys[0])
    setViewDate(anchor)
    setSelectedKey(pick)
  }

  const navigate = (offset) =>
    moveTo(
      view === "week"
        ? addDays(viewDate, offset * 7)
        : new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1)
    )

  const goToToday = () => {
    setViewDate(today)
    setSelectedKey(todayKey)
  }

  const jumpTo = (date) => {
    setViewDate(date)
    setSelectedKey(toKey(date))
  }

  const handleSelectDay = (date) => {
    setSelectedKey(toKey(date))
    // Clicking a greyed-out day, or a day outside the week, moves the view.
    if (!isInPeriod(date)) setViewDate(date)
  }

  const handleViewChange = (next) => {
    setView(next)
    setViewDate(fromKey(selectedKey))
  }

  // --- Filters ---------------------------------------------------------------

  const toggleType = (type) =>
    setHiddenTypes((current) =>
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type]
    )

  const showAllTypes = () => setHiddenTypes([])

  const clearFilters = () => {
    setHiddenTypes([])
    setQuery("")
    onClearExternalFilters?.()
  }

  const handleSelectCard = (item) => {
    if (activeCard === item.label) {
      showAllTypes()
      return
    }
    const types = toArray(item.filterType)
    setHiddenTypes(typeOrder.filter((t) => !types.includes(t)))
    setQuery("")

    // Jump to the closest matching event if none is in view.
    const matching = events.filter((event) => types.includes(event.type))
    if (matching.length > 0 && !matching.some((e) => isInPeriod(e.date))) {
      const closest = matching.reduce((best, event) =>
        Math.abs(event.date - today) < Math.abs(best.date - today)
          ? event
          : best
      )
      jumpTo(closest.date)
    }
  }

  // --- Keyboard: arrows move between days in the month grid -----------------

  const handleGridKeyDown = (event) => {
    if (!event.target.closest?.("[data-day-key]")) return

    const current = fromKey(selectedKey)
    const steps = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    let next

    if (steps[event.key] !== undefined) next = addDays(current, steps[event.key])
    else if (event.key === "Home") next = addDays(current, -current.getDay())
    else if (event.key === "End") next = addDays(current, 6 - current.getDay())
    else if (event.key === "PageUp") next = shiftMonth(current, -1)
    else if (event.key === "PageDown") next = shiftMonth(current, 1)
    else return

    event.preventDefault()
    focusRequest.current = true
    handleSelectDay(next)
  }

  useEffect(() => {
    if (!focusRequest.current) return
    focusRequest.current = false
    gridRef.current
      ?.querySelector(`[data-day-key="${selectedKey}"]`)
      ?.focus()
  }, [selectedKey, viewDate])

  // --- Render ---------------------------------------------------------------

  const showCalendar = !loading && events.length > 0
  const showEmptyAll = !loading && !errorMessage && events.length === 0
  const mainLayout =
    view === "list"
      ? "grid gap-5"
      : "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]"

  return (
    <div
      data-slot="event-calendar"
      className={cn(
        "flex flex-1 flex-col gap-5 px-2 py-2 sm:px-4 lg:px-6",
        className
      )}
    >
      <CalendarToolbar
        title={title}
        description={description}
        viewDate={viewDate}
        label={periodLabel}
        view={view}
        views={VIEWS}
        onViewChange={handleViewChange}
        previousLabel={view === "week" ? "Previous week" : "Previous month"}
        nextLabel={view === "week" ? "Next week" : "Next month"}
        onPrevious={() => navigate(-1)}
        onNext={() => navigate(1)}
        onToday={goToToday}
      />

      {notice}

      {errorMessage && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-medium">We couldn’t load your calendar</p>
              <p className="text-red-700/90">{errorMessage}</p>
            </div>
          </div>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          )}
        </div>
      )}

      {loading && <CalendarSkeleton />}

      {showEmptyAll && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed bg-background px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <CalendarDays className="size-5" aria-hidden="true" />
          </div>
          <h2 className="text-sm font-semibold">{emptyTitle}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">
            {emptyDescription}
          </p>
        </div>
      )}

      {showCalendar && (
        <>
          <CalendarSummaryCards
            items={summary}
            caption={summaryCaption}
            activeLabel={activeCard}
            onSelect={handleSelectCard}
          />

          {(searchable || toolbarExtras) && (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              {searchable && (
                <div className="relative w-full sm:max-w-xs">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    aria-label={searchPlaceholder}
                    className="h-9 w-full rounded-md border bg-background pl-8 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  />
                </div>
              )}
              {toolbarExtras}
            </div>
          )}

          <CalendarLegend
            eventTypes={eventTypes}
            counts={countsByType}
            hiddenTypes={hiddenTypes}
            onToggle={toggleType}
            onShowAll={showAllTypes}
            filtersActive={filtersActive}
            onClear={clearFilters}
          />

          <p className="sr-only" role="status" aria-live="polite">
            {filtersActive
              ? `${periodEvents.length} events in ${periodLabel}`
              : ""}
          </p>

          {periodEvents.length === 0 && (
            <div
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/30 px-4 py-3 text-sm"
            >
              <p className="text-muted-foreground">
                {visibleEvents.length === 0
                  ? "No events match your current filters."
                  : `Nothing scheduled in ${periodLabel}.`}
              </p>
              {visibleEvents.length === 0 ? (
                filtersActive && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </Button>
                )
              ) : (
                nearestEvent && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => jumpTo(nearestEvent.date)}
                  >
                    Go to {SHORT_DAY_FORMAT.format(nearestEvent.date)}
                  </Button>
                )
              )}
            </div>
          )}

          <div className={mainLayout}>
            {view === "month" && (
              <section className="overflow-hidden rounded-xl border bg-background">
                <div className="grid grid-cols-7 border-b bg-muted/40">
                  {WEEKDAYS.map((day) => (
                    <div
                      key={day}
                      className="px-2 py-2.5 text-center text-xs font-medium uppercase text-muted-foreground"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <p id="calendar-keyboard-hint" className="sr-only">
                  Use the arrow keys to move between days, and Page Up or Page
                  Down to change month.
                </p>
                <div
                  ref={gridRef}
                  role="group"
                  aria-label={`Calendar for ${periodLabel}`}
                  aria-describedby="calendar-keyboard-hint"
                  onKeyDown={handleGridKeyDown}
                  className="grid grid-cols-7 gap-px bg-border"
                >
                  {gridDays.map((date) => {
                    const key = toKey(date)
                    return (
                      <CalendarDayCell
                        key={key}
                        date={date}
                        events={eventsByDay[key] ?? []}
                        eventTypes={eventTypes}
                        isInMonth={isSameMonth(date, viewDate)}
                        isToday={key === todayKey}
                        isSelected={key === selectedKey}
                        onSelect={handleSelectDay}
                        onOpenEvent={onOpenEvent}
                      />
                    )
                  })}
                </div>
              </section>
            )}

            {view === "week" && (
              <CalendarWeekView
                days={weekDays}
                eventsByDay={eventsByDay}
                eventTypes={eventTypes}
                todayKey={todayKey}
                selectedKey={selectedKey}
                onSelect={handleSelectDay}
                onOpenEvent={onOpenEvent}
              />
            )}

            {view === "list" && listGroups.length > 0 && (
              <CalendarListView
                groups={listGroups}
                eventTypes={eventTypes}
                todayKey={todayKey}
                onSelectDay={handleSelectDay}
                onOpenEvent={onOpenEvent}
              />
            )}

            {view !== "list" && (
              <CalendarAgenda
                date={selectedDate}
                events={selectedEvents}
                eventTypes={eventTypes}
                onOpenEvent={onOpenEvent}
                emptyMessage={emptyMessage}
              />
            )}
          </div>
        </>
      )}
    </div>
  )
}
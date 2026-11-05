import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MONTH_FORMAT } from "./calendar-utils"

/**
 * Page title plus view switcher and previous / next / today controls.
 *
 * @param {string} title
 * @param {string} description
 * @param {Date} viewDate - Used for the label when `label` is not given.
 * @param {string} label - Period label, e.g. "October 2026" or "Oct 18 – 24, 2026".
 * @param {string} view - Current view value.
 * @param {Array} views - [{ value, label }]. The switcher shows when there are 2 or more.
 * @param {Function} onViewChange - (value) => void
 * @param {Function} onPrevious
 * @param {Function} onNext
 * @param {Function} onToday
 * @param {string} previousLabel - Accessible name of the previous button.
 * @param {string} nextLabel - Accessible name of the next button.
 */
export function CalendarToolbar({
  title,
  description,
  viewDate,
  label,
  view,
  views = [],
  onViewChange,
  onPrevious,
  onNext,
  onToday,
  previousLabel = "Previous month",
  nextLabel = "Next month",
  className,
  ...props
}) {
  return (
    <div
      data-slot="calendar-toolbar"
      className={cn(
        "flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between",
        className
      )}
      {...props}
    >
      <div>
        <h1 className="text-lg font-semibold sm:text-xl">{title}</h1>
        {description && (
          <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {views.length > 1 && (
          <div
            role="group"
            aria-label="Calendar view"
            className="inline-flex rounded-md border bg-background p-0.5"
          >
            {views.map((item) => (
              <button
                key={item.value}
                type="button"
                aria-pressed={view === item.value}
                onClick={() => onViewChange?.(item.value)}
                className={cn(
                  "rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  view === item.value
                    ? "bg-emerald-700 text-white"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={previousLabel}
            onClick={onPrevious}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span
            className="min-w-40 text-center text-sm font-semibold"
            aria-live="polite"
          >
            {label ?? MONTH_FORMAT.format(viewDate)}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={nextLabel}
            onClick={onNext}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onToday}>
            Today
          </Button>
        </div>
      </div>
    </div>
  )
}
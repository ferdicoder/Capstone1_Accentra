import { useEffect, useRef, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { EMPTY_RANGE } from "../lib/constants"
import { isoDate, pad, rangeError, toDate } from "../lib/utils"
import { controlClass, NativeSelect } from "./form-fields"

// Calendar popup that follows the app's own look (shadcn tokens, forest/emerald
// accents, rounded-xl surfaces, text-xs sizing). The native <input type="date">
// popup cannot be styled, so this replaces it.
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

const calendarSelectClass =
  "h-8 rounded-lg pr-6 border border-input bg-background px-1.5 text-xs font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
const navButtonClass =
  "flex size-8 shrink-0 items-center justify-center rounded-lg border bg-background text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"

// One field, one calendar: click a start day, then an end day. Clicking the
// same day twice selects a single day. Days between the two are highlighted.
export function DateRange({ label, value, onChange }) {
  const [open, setOpen] = useState(false)
  const [anchor, setAnchor] = useState(null) // first click of a pending range
  const ref = useRef(null)
  const today = new Date()
  const start = toDate(value.from)
  const [cursor, setCursor] = useState(() => {
    const base = start ?? today
    return { month: base.getMonth(), year: base.getFullYear() }
  })
  const error = rangeError(value)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const toggle = () => {
    if (!open) {
      const base = start ?? today
      setCursor({ month: base.getMonth(), year: base.getFullYear() })
      setAnchor(null)
    }
    setOpen((o) => !o)
  }
  const shift = (delta) =>
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1)
      return { month: d.getMonth(), year: d.getFullYear() }
    })

  const pick = (day) => {
    const iso = `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`
    if (anchor === null) {
      setAnchor(iso)
      onChange({ from: iso, to: iso })
    } else {
      onChange(iso < anchor ? { from: iso, to: anchor } : { from: anchor, to: iso })
      setAnchor(null)
      setOpen(false)
    }
  }

  const firstWeekday = new Date(cursor.year, cursor.month, 1).getDay()
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate()
  const cells = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const startYear = Math.min(today.getFullYear() - 30, cursor.year)
  const endYear = Math.max(today.getFullYear() + 5, cursor.year)
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
  const todayIso = isoDate(today)

  const fmt = (iso) => {
    const d = toDate(iso)
    return d ? `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}` : ""
  }
  const text = value.from
    ? value.to && value.to !== value.from
      ? `${fmt(value.from)} – ${fmt(value.to)}`
      : fmt(value.from)
    : ""

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div ref={ref} className="relative min-w-0">
        <button
          type="button"
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={toggle}
          className={cn(controlClass, "flex items-center justify-between gap-2 text-left")}
        >
          <span className={cn("truncate", !text && "text-muted-foreground")}>
            {text || "Select dates"}
          </span>
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>

        {open && (
          <div
            role="dialog"
            aria-label={`${label} calendar`}
            className="absolute left-0 top-full z-50 mt-1.5 w-72 max-w-full rounded-xl border bg-background p-3 shadow-lg"
          >
            <div className="flex items-center justify-between gap-2">
              <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className={navButtonClass}>
                <ChevronLeft className="size-4" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-1.5">
                <NativeSelect
                  wrapperClassName="relative inline-block"
                  iconClassName="right-1.5 size-3.5"
                  aria-label="Month"
                  value={cursor.month}
                  onChange={(e) => setCursor((c) => ({ ...c, month: Number(e.target.value) }))}
                  className={calendarSelectClass}
                >
                  {MONTH_NAMES.map((name, index) => (
                    <option key={name} value={index}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
                <NativeSelect
                  wrapperClassName="relative inline-block"
                  iconClassName="right-1.5 size-3.5"
                  aria-label="Year"
                  value={cursor.year}
                  onChange={(e) => setCursor((c) => ({ ...c, year: Number(e.target.value) }))}
                  className={calendarSelectClass}
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <button type="button" aria-label="Next month" onClick={() => shift(1)} className={navButtonClass}>
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-7 rounded-lg bg-muted/40 text-center text-[11px] font-medium text-muted-foreground">
              {WEEKDAYS.map((day) => (
                <span key={day} className="py-1.5">
                  {day}
                </span>
              ))}
            </div>

            <div className="mt-1.5 grid grid-cols-7 gap-1">
              {cells.map((day, index) => {
                if (day === null) return <span key={`blank-${index}`} />
                const iso = `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`
                const isEnd = iso === value.from || iso === value.to
                const isBetween = value.from && value.to && iso > value.from && iso < value.to
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => pick(day)}
                    aria-pressed={isEnd}
                    aria-current={iso === todayIso ? "date" : undefined}
                    className={cn(
                      "h-8 rounded-lg text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                      isEnd
                        ? "bg-forest-900 font-semibold text-white"
                        : isBetween
                          ? "bg-emerald-500/10 text-emerald-800 hover:bg-emerald-500/20"
                          : iso === todayIso
                            ? "font-semibold text-emerald-700 ring-1 ring-emerald-500/30 ring-inset hover:bg-muted"
                            : "text-foreground hover:bg-muted"
                    )}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t pt-2 text-xs">
              <span className="text-muted-foreground">
                {anchor ? "Now pick the end date" : "Pick a start date"}
              </span>
              <button
                type="button"
                onClick={() => {
                  onChange(EMPTY_RANGE)
                  setAnchor(null)
                  setOpen(false)
                }}
                className="font-medium text-emerald-700 hover:text-emerald-800"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
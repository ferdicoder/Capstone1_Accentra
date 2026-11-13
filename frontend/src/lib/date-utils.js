import { useEffect, useState } from "react"

/**
 * Shared helpers for every calendar page (Client, Billing Officer, Firm).
 * All dates are handled in local time to avoid timezone surprises.
 */

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export const MONTH_FORMAT = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
})

export const DAY_FORMAT = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
})

export const SHORT_DAY_FORMAT = new Intl.DateTimeFormat("en-PH", {
  weekday: "short",
  month: "short",
  day: "numeric",
})

const pad = (n) => String(n).padStart(2, "0")

/** Date -> "YYYY-MM-DD" */
export const toKey = (date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** "YYYY-MM-DD" -> Date (local midnight) */
export const fromKey = (key) => {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}

export const startOfDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const addDays = (date, n) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)

export const startOfMonth = (date) =>
  new Date(date.getFullYear(), date.getMonth(), 1)

export const isSameMonth = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

export const isSameDay = (a, b) => toKey(a) === toKey(b)

/** Sunday of the week that contains the date. */
export const startOfWeek = (date) => addDays(startOfDay(date), -date.getDay())

/** The 7 days (Sun-Sat) of the week that contains the date. */
export const buildWeek = (date) =>
  Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i))

/** Moves a date by whole months and keeps the day of month inside the target month. */
export function shiftMonth(date, offset) {
  const target = new Date(date.getFullYear(), date.getMonth() + offset, 1)
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate()
  return new Date(
    target.getFullYear(),
    target.getMonth(),
    Math.min(date.getDate(), lastDay)
  )
}

/** Every day of the month that contains the date. */
export function buildMonthDays(date) {
  const total = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  return Array.from(
    { length: total },
    (_, i) => new Date(date.getFullYear(), date.getMonth(), i + 1)
  )
}

/** "Oct 18 – 24, 2026" */
export function formatWeekRange(date) {
  const days = buildWeek(date)
  const first = days[0]
  const last = days[6]
  const sameMonth = first.getMonth() === last.getMonth()
  const start = first.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  })
  const end = last.toLocaleDateString(
    "en-PH",
    sameMonth ? { day: "numeric" } : { month: "short", day: "numeric" }
  )
  return `${start} – ${end}, ${last.getFullYear()}`
}

/** Accepts "YYYY-MM-DD" or a full ISO timestamp. Returns local midnight, or null. */
export function parseDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return fromKey(value)
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return startOfDay(parsed)
}

/** Always 6 weeks (42 cells) so the grid height doesn't jump between months. */
export function buildMonthGrid(viewDate) {
  const first = startOfMonth(viewDate)
  const gridStart = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
}

/** ₱2,500.00 */
export function formatCurrency(amount) {
  return `₱${Number(amount).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const pluralize = (count, word) =>
  `${count} ${word}${count === 1 ? "" : "s"}`

/** Whole days from one date to another (negative when `to` is earlier). */
export const daysBetween = (from, to) =>
  Math.round((startOfDay(to) - startOfDay(from)) / 86400000)

/** "Due today", "Due in 5 days", "3 days overdue" */
export function describeDueDate(dueDate, today) {
  const diff = daysBetween(today, dueDate)
  if (diff === 0) return "Due today"
  if (diff > 0) return `Due in ${pluralize(diff, "day")}`
  return `${pluralize(-diff, "day")} overdue`
}

/** Returns today's date and keeps it correct if the page stays open past midnight. */
export function useToday() {
  const [today, setToday] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    const msUntilTomorrow = addDays(today, 1).getTime() - Date.now() + 1000
    const timer = setTimeout(
      () => setToday(startOfDay(new Date())),
      Math.max(msUntilTomorrow, 1000)
    )
    return () => clearTimeout(timer)
  }, [today])

  return today
}
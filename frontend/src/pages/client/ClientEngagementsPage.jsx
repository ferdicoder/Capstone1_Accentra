import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Search,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyEngagements } from "@/hooks/useEngagements"
import { PaginationFooter, PAGE_SIZE } from "@/components/shared/pagination-footer"
import { NoBusinessBanner } from "@/components/client/NoBusinessBanner"
import { authStore } from "@/store/authStore"
import { stageLabel } from "@/lib/vocab"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { formatDate } from "@/components/firm/engagements/engagement-variants"

// Filter value meaning "no status filter". The other values are raw engagement
// statuses, so the filter never depends on a display label.
const ALL_STATUSES = "all"
// Lifecycle order shown in the status filter.
const STATUS_ORDER = [
  "document_collection",
  "for_validation",
  "in_progress",
  "completed",
  "cancelled",
]

const ALL_SERVICES = "All Services"
const CLOSED_STATUSES = ["completed", "cancelled"]
const HIGHLIGHT_MS = 3000

// The two date columns that have a filter and a sort.
const CREATED = "createdAt"
const DUE = "targetEndDate"

const DATE_FIELDS = {
  [CREATED]: { label: "Created", noun: "created date", noneLabel: "No created date" },
  [DUE]: { label: "Due date", noun: "due date", noneLabel: "No due date" },
}

const MONTHS = [
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

// ── Date filter model ──────────────────────────────────────────────────────
// A date filter is { year, month }. Month only means something once a year is
// picked, so the UI never lets you choose a month on its own.
const ALL_YEARS = "all"
const ALL_MONTHS = "all"
const NO_DATE = "none" // year value meaning "engagements that have no date"

const NO_DATE_FILTER = { year: ALL_YEARS, month: ALL_MONTHS }
const isDateFilterActive = (filter) => filter.year !== ALL_YEARS
const isYearValue = (year) => year !== ALL_YEARS && year !== NO_DATE

// Parses date-only strings ("2026-03-01") as LOCAL dates. new Date("2026-03-01")
// is UTC midnight, which is the previous day for anyone west of UTC and would
// land in the wrong month. Full timestamps are left to the normal parser.
const toLocalDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(value)
}

// Returns a valid Date for the given field, or null when it has no usable date.
const getEngagementDate = (engagement, field) => {
  const value = engagement?.[field]
  if (!value) return null
  const date = toLocalDate(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function matchesDateFilter(engagement, field, filter) {
  if (!isDateFilterActive(filter)) return true
  const date = getEngagementDate(engagement, field)
  if (filter.year === NO_DATE) return !date
  if (!date) return false
  const matchesYear = date.getFullYear() === Number(filter.year)
  const matchesMonth = filter.month === ALL_MONTHS || date.getMonth() === Number(filter.month)
  return matchesYear && matchesMonth
}

// Short human text for the chip and the filter button, e.g. "March 2026".
function describeDateFilter(field, filter) {
  if (filter.year === NO_DATE) return "Not set"
  if (filter.month !== ALL_MONTHS) return `${MONTHS[Number(filter.month)]} ${filter.year}`
  return String(filter.year)
}

// Which years and months actually appear in a column, so the pickers can never
// offer a combination that returns nothing.
function buildDateIndex(engagements, field) {
  const byYear = new Map()
  let hasUndated = false

  for (const engagement of engagements) {
    const date = getEngagementDate(engagement, field)
    if (!date) {
      hasUndated = true
      continue
    }
    const year = date.getFullYear()
    if (!byYear.has(year)) byYear.set(year, new Set())
    byYear.get(year).add(date.getMonth())
  }

  const months = new Map(
    [...byYear.entries()].map(([year, set]) => [year, [...set].sort((a, b) => a - b)])
  )
  const years = [...byYear.keys()].sort((a, b) => b - a)
  return { years, months, hasUndated }
}

// Turns the due date into a label + tone so overdue / due-soon engagements
// stand out, and finished ones stay quiet.
function getDueInfo(engagement) {
  const dueDate = getEngagementDate(engagement, DUE)
  if (!dueDate) return { label: "—", hint: "", tone: "muted" }

  const label = formatDate(engagement.targetEndDate)
  if (CLOSED_STATUSES.includes(engagement.status)) return { label, hint: "", tone: "muted" }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const days = Math.round((due - today) / 86400000)

  if (days < 0) {
    return { label, hint: `Overdue by ${-days} day${days === -1 ? "" : "s"}`, tone: "red" }
  }
  if (days === 0) return { label, hint: "Due today", tone: "amber" }
  if (days <= 7) return { label, hint: `Due in ${days} day${days === 1 ? "" : "s"}`, tone: "amber" }
  return { label, hint: "", tone: "muted" }
}

const dueToneClass = {
  red: "text-red-600",
  amber: "text-amber-700",
  muted: "text-muted-foreground",
}

function DueDate({ engagement }) {
  const due = getDueInfo(engagement)
  return (
    <div className={cn("flex flex-col", dueToneClass[due.tone])}>
      <span className={due.tone === "muted" ? "" : "font-medium"}>{due.label}</span>
      {due.hint && <span className="text-xs">{due.hint}</span>}
    </div>
  )
}

// ── Sorting ────────────────────────────────────────────────────────────────
// Sorting is a view preference, separate from filtering: it is never counted as
// a filter and "Clear all" leaves it alone.
const DEFAULT_SORT = { field: CREATED, direction: "desc" }
const SORT_OPTIONS = [
  { field: CREATED, direction: "desc", label: "Created: newest first" },
  { field: CREATED, direction: "asc", label: "Created: oldest first" },
  { field: DUE, direction: "asc", label: "Due date: soonest first" },
  { field: DUE, direction: "desc", label: "Due date: latest first" },
]
const sortKey = (sort) => `${sort.field}:${sort.direction}`

// Plain sortable column header: click to sort, click again to reverse. The
// arrow only appears on the column that is actually sorted.
function SortHeader({ field, sort, onSort }) {
  const active = sort.field === field
  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className="-mx-1 inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 text-xs font-medium uppercase hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
    >
      {DATE_FIELDS[field].label}
      <Icon
        className={cn("size-3.5", !active && "text-muted-foreground")}
        aria-hidden="true"
      />
    </button>
  )
}

// ── Date filter (sits in the filter bar, filter only — no sorting) ─────────
// On phones the panel is a bottom sheet; from `sm` up it is a dropdown under
// the button. It stays open until the person closes it, so scrolling or the
// browser toolbar resizing can't dismiss it mid-selection.

const selectClass = "h-9 w-full rounded-lg border border-input bg-background px-2.5 text-sm disabled:opacity-50"

function DateFilter({ field, filter, onChange, index }) {
  const { label, noneLabel } = DATE_FIELDS[field]
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef(null)
  const buttonRef = useRef(null)
  const id = useId()

  const active = isDateFilterActive(filter)
  const yearPicked = isYearValue(filter.year)
  // With a year picked: that year's months. With no year: every month that
  // appears in any year, so Month is always usable.
  const availableMonths = yearPicked
    ? index.months.get(Number(filter.year)) ?? []
    : filter.year === ALL_YEARS
      ? [...new Set([...index.months.values()].flat())].sort((a, b) => a - b)
      : []

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [open])

  const handleYearChange = (year) => {
    // Keep the month only if that year actually has engagements in it.
    const monthStillValid =
      isYearValue(year) && (index.months.get(Number(year)) ?? []).includes(Number(filter.month))
    onChange(field, { year, month: monthStillValid ? filter.month : ALL_MONTHS })
  }

  // Picking a month with no year selected auto-selects the most recent year
  // that has that month, so the filter is always a specific "March 2026".
  const handleMonthChange = (month) => {
    if (month === ALL_MONTHS || yearPicked) {
      onChange(field, { ...filter, month })
      return
    }
    const latestYear = index.years.find((year) =>
      (index.months.get(year) ?? []).includes(Number(month))
    )
    if (latestYear !== undefined) onChange(field, { year: String(latestYear), month })
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        className={cn(
          "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
          active
            ? "border-emerald-600 bg-emerald-50 font-medium text-emerald-800"
            : "border-input bg-background"
        )}
      >
        {active ? `${label}: ${describeDateFilter(field, filter)}` : label}
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 sm:hidden"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          <div
            id={id}
            role="dialog"
            aria-label={`Filter by ${label.toLowerCase()}`}
            className="fixed inset-x-0 bottom-0 z-50 flex flex-col gap-3 rounded-t-2xl border bg-background p-4 pb-6 text-sm shadow-xl sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-full sm:mt-1.5 sm:w-[264px] sm:rounded-xl sm:p-3 sm:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">Filter by {label.toLowerCase()}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-emerald-700 hover:text-emerald-800 sm:hidden"
              >
                Done
              </button>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-year`} className="text-xs font-medium text-muted-foreground">
                Year
              </label>
              <select
                id={`${id}-year`}
                value={filter.year}
                onChange={(event) => handleYearChange(event.target.value)}
                className={selectClass}
              >
                <option value={ALL_YEARS}>All years</option>
                {index.years.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
                {(index.hasUndated || filter.year === NO_DATE) && (
                  <option value={NO_DATE}>{noneLabel}</option>
                )}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor={`${id}-month`} className="text-xs font-medium text-muted-foreground">
                Month
              </label>
              <select
                id={`${id}-month`}
                value={filter.month}
                disabled={filter.year === NO_DATE}
                onChange={(event) => handleMonthChange(event.target.value)}
                className={selectClass}
              >
                <option value={ALL_MONTHS}>All months</option>
                {availableMonths.map((month) => (
                  <option key={month} value={String(month)}>
                    {MONTHS[month]}
                  </option>
                ))}
              </select>
              {filter.year === NO_DATE && (
                <p className="text-xs text-muted-foreground">
                  Showing engagements without this date.
                </p>
              )}
              {filter.year === ALL_YEARS && (
                <p className="text-xs text-muted-foreground">
                  Picking a month selects the latest year that has it. You can change the year
                  after.
                </p>
              )}
            </div>

            {active && (
              <button
                type="button"
                onClick={() => onChange(field, NO_DATE_FILTER)}
                className="self-start text-xs font-medium text-emerald-700 hover:text-emerald-800"
              >
                Clear {label.toLowerCase()} filter
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// A removable pill showing one active filter.
function FilterChip({ text, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 py-0.5 pl-2.5 pr-1 text-xs font-medium text-emerald-800">
      {text}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove filter: ${text}`}
        className="flex size-5 items-center justify-center rounded-full hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </span>
  )
}

// The real, keyboard-focusable link for a row. Screen readers announce the
// engagement number, and the row keeps its normal table / list semantics.
// stopPropagation keeps the row's click handler from navigating a second time.
function EngagementLink({ engagement, className }) {
  return (
    <Link
      to={`/client/engagements/${engagement.id}`}
      onClick={(event) => event.stopPropagation()}
      className={cn(
        "rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
        className
      )}
    >
      {engagement.engagementNumber}
    </Link>
  )
}

// Mouse convenience only: clicking anywhere on the row opens the engagement.
// Keyboard and screen reader users use the link inside the row. The data
// attributes let the highlight effect find the row.
function getRowProps(engagement, navigate, highlightedId) {
  return {
    "data-engagement-id": engagement.id,
    "data-highlighted": highlightedId === engagement.id ? "true" : undefined,
    onClick: () => navigate(`/client/engagements/${engagement.id}`),
  }
}

const highlightClass =
  "data-[highlighted=true]:bg-emerald-50 data-[highlighted=true]:ring-2 data-[highlighted=true]:ring-inset data-[highlighted=true]:ring-emerald-500"

function EngagementCard({ engagement, navigate, highlightedId }) {
  return (
    <li
      {...getRowProps(engagement, navigate, highlightedId)}
      className={cn(
        "flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:bg-muted/30 focus-within:bg-muted/30",
        highlightClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">
          <EngagementLink engagement={engagement} />
        </p>
        <EngagementStatusBadge status={stageLabel(engagement.status)} />
      </div>
      <p className="text-sm font-medium">{engagement.serviceName}</p>
      {engagement.category && (
        <p className="text-xs text-muted-foreground">{engagement.category}</p>
      )}
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">Created {formatDate(engagement.createdAt)}</span>
        <span className="flex items-center gap-1 text-sm">
          <span className="text-xs text-muted-foreground">Due</span>
          <DueDate engagement={engagement} />
        </span>
      </div>
    </li>
  )
}

export default function ClientEngagementsPage() {
  const user = authStore((state) => state.user)
  const navigate = useNavigate()
  const location = useLocation()
  const { data: business } = useFetchMyBusiness(user?.id)
  const businessId = business?.id
  const {
    data: engagements = [],
    isLoading,
    error,
    refetch,
  } = useFetchMyEngagements(businessId)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES) // raw status, or ALL_STATUSES
  const [typeFilter, setTypeFilter] = useState(ALL_SERVICES)
  // Year / month filter for each date column.
  const [createdFilter, setCreatedFilter] = useState(NO_DATE_FILTER)
  const [dueFilter, setDueFilter] = useState(NO_DATE_FILTER)
  // Which date column the list is sorted by, and in which direction.
  const [sort, setSort] = useState(DEFAULT_SORT)
  const [page, setPage] = useState(1)

  // Set by the Service Requests page when the client picks an approved request.
  const [highlightedId, setHighlightedId] = useState(
    () => location.state?.highlightEngagementId ?? null
  )

  const dateFilters = { [CREATED]: createdFilter, [DUE]: dueFilter }

  const handleSortChange = (next) => {
    setSort(next)
    setPage(1)
  }

  // Clicking a column header: same column reverses, a new column starts at its
  // natural direction (newest created first, soonest due first).
  const handleHeaderSort = (field) => {
    if (sort.field === field) {
      handleSortChange({ field, direction: sort.direction === "asc" ? "desc" : "asc" })
    } else {
      handleSortChange({ field, direction: field === DUE ? "asc" : "desc" })
    }
  }

  const handleDateFilterChange = (field, next) => {
    if (field === CREATED) setCreatedFilter(next)
    else setDueFilter(next)
    setPage(1)
  }

  // The five lifecycle statuses in order, plus any other status found in the
  // data so no engagement becomes impossible to filter for.
  const statusOptions = useMemo(() => {
    const extra = [...new Set(engagements.map((e) => e.status).filter(Boolean))].filter(
      (status) => !STATUS_ORDER.includes(status)
    )
    return [
      { value: ALL_STATUSES, label: "All Statuses" },
      ...[...STATUS_ORDER, ...extra].map((status) => ({
        value: status,
        label: stageLabel(status),
      })),
    ]
  }, [engagements])

  const typeOptions = useMemo(() => {
    const categories = engagements.map((e) => e.category).filter(Boolean)
    return [ALL_SERVICES, ...[...new Set(categories)].sort()]
  }, [engagements])

  // Years and months that really exist in each date column.
  const createdIndex = useMemo(() => buildDateIndex(engagements, CREATED), [engagements])
  const dueIndex = useMemo(() => buildDateIndex(engagements, DUE), [engagements])
  const dateIndexes = { [CREATED]: createdIndex, [DUE]: dueIndex }

  const { filteredEngagements, hiddenNoDate } = useMemo(() => {
    const query = search.trim().toLowerCase()
    const direction = sort.direction === "asc" ? 1 : -1
    const filters = { [CREATED]: createdFilter, [DUE]: dueFilter }

    // `skipField` lets us ask "what would show if this date filter were off?"
    const matchesAll = (e, skipField) => {
      const matchesSearch =
        !query ||
        [e.engagementNumber, e.serviceName, e.category].some((field) =>
          field?.toLowerCase().includes(query)
        )
      const matchesStatus = statusFilter === ALL_STATUSES || e.status === statusFilter
      const matchesType = typeFilter === ALL_SERVICES || e.category === typeFilter

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        [CREATED, DUE].every(
          (field) => field === skipField || matchesDateFilter(e, field, filters[field])
        )
      )
    }

    const filtered = engagements.filter((e) => matchesAll(e)).sort((a, b) => {
      const da = getEngagementDate(a, sort.field)?.getTime()
      const db = getEngagementDate(b, sort.field)?.getTime()
      // No date always goes last, whichever direction is chosen.
      if (da === undefined && db === undefined) return 0
      if (da === undefined) return 1
      if (db === undefined) return -1
      return (da - db) * direction
    })

    // Engagements with no date are hidden by a year / month filter. Count them
    // so the page can say so instead of silently dropping rows.
    const hidden = [CREATED, DUE]
      .filter((field) => isYearValue(filters[field].year))
      .map((field) => ({
        field,
        count: engagements.filter(
          (e) => !getEngagementDate(e, field) && matchesAll(e, field)
        ).length,
      }))
      .filter((item) => item.count > 0)

    return { filteredEngagements: filtered, hiddenNoDate: hidden }
  }, [engagements, search, statusFilter, typeFilter, createdFilter, dueFilter, sort])

  const totalPages = Math.max(1, Math.ceil(filteredEngagements.length / PAGE_SIZE))
  const visiblePage = Math.min(page, totalPages)
  const paginatedEngagements = filteredEngagements.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE
  )

  // Every active filter, as a removable chip. Sorting is not a filter.
  const activeFilters = []
  if (search.trim()) {
    activeFilters.push({
      key: "search",
      text: `Search: "${search.trim()}"`,
      onRemove: () => {
        setSearch("")
        setPage(1)
      },
    })
  }
  if (statusFilter !== ALL_STATUSES) {
    activeFilters.push({
      key: "status",
      text: `Status: ${statusOptions.find((o) => o.value === statusFilter)?.label ?? statusFilter}`,
      onRemove: () => {
        setStatusFilter(ALL_STATUSES)
        setPage(1)
      },
    })
  }
  if (typeFilter !== ALL_SERVICES) {
    activeFilters.push({
      key: "service",
      text: `Service: ${typeFilter}`,
      onRemove: () => {
        setTypeFilter(ALL_SERVICES)
        setPage(1)
      },
    })
  }
  for (const field of [CREATED, DUE]) {
    if (isDateFilterActive(dateFilters[field])) {
      activeFilters.push({
        key: field,
        text: `${DATE_FIELDS[field].label}: ${describeDateFilter(field, dateFilters[field])}`,
        onRemove: () => handleDateFilterChange(field, NO_DATE_FILTER),
      })
    }
  }
  const hasActiveFilters = activeFilters.length > 0

  // Clears filters only. Sort is a separate view setting and is left as is.
  const clearFilters = () => {
    setSearch("")
    setStatusFilter(ALL_STATUSES)
    setTypeFilter(ALL_SERVICES)
    setCreatedFilter(NO_DATE_FILTER)
    setDueFilter(NO_DATE_FILTER)
    setPage(1)
  }

  // Scroll to the picked engagement once the list has loaded, flash it, then
  // clear the router state so a refresh doesn't replay it.
  useEffect(() => {
    if (!highlightedId || isLoading) return

    const target = [...document.querySelectorAll(`[data-engagement-id="${highlightedId}"]`)].find(
      (node) => node.offsetParent !== null
    )
    target?.scrollIntoView({ behavior: "smooth", block: "center" })

    navigate(location.pathname, { replace: true, state: null })
    const timer = window.setTimeout(() => setHighlightedId(null), HIGHLIGHT_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightedId, isLoading])

  usePageMeta({
    title: "Engagements",
    breadcrumbs: [],
    hasUnreadNotifications: true,
  })

  const hasNoEngagements = !isLoading && !error && engagements.length === 0
  const hasNoMatches = !isLoading && engagements.length > 0 && filteredEngagements.length === 0

  const ariaSort = (field) =>
    sort.field === field ? (sort.direction === "asc" ? "ascending" : "descending") : "none"

  // The button goes to My Requests, not straight to the request form. A client
  // with no engagements may already have a request under review, or an unpaid
  // bill, and that page is where those cases are explained.
  const emptyState = (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FolderOpen className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">No engagements yet</p>
      <p className="text-xs text-muted-foreground">
        Once your firm approves a service request, your engagement will appear here. You can
        check or submit requests on the My Requests page.
      </p>
      <Button asChild size="sm" className="mt-2">
        <Link to="/client/service-requests">Go to My Requests</Link>
      </Button>
    </div>
  )

  // Names the filters that are on, so the person knows what to change.
  const noMatches = (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
      <p className="text-sm font-medium text-foreground">No engagements match</p>
      {hasActiveFilters && (
        <p className="text-xs text-muted-foreground">
          Active filters: {activeFilters.map((filter) => filter.text).join(", ")}
        </p>
      )}
      <button
        type="button"
        onClick={clearFilters}
        className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
      >
        Clear all filters
      </button>
    </div>
  )

  const resultCount =
    filteredEngagements.length === engagements.length
      ? `${engagements.length} engagement${engagements.length === 1 ? "" : "s"}`
      : `Showing ${filteredEngagements.length} of ${engagements.length} engagements`

  return (
    <div className="flex flex-1 flex-col gap-4 px-2 py-2">
      <div>
        <h1 className="text-xl font-semibold">My Engagements</h1>
      </div>

      {business === null && <NoBusinessBanner />}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full min-w-55 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search engagements..."
              aria-label="Search engagements"
              className="pl-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by status"
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value)
              setPage(1)
            }}
            aria-label="Filter by service type"
            className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          <DateFilter
            field={CREATED}
            filter={createdFilter}
            onChange={handleDateFilterChange}
            index={createdIndex}
          />
          <DateFilter
            field={DUE}
            filter={dueFilter}
            onChange={handleDateFilterChange}
            index={dueIndex}
          />

          <label className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
            Sort by
            <select
              value={sortKey(sort)}
              onChange={(e) => {
                const [field, direction] = e.target.value.split(":")
                handleSortChange({ field, direction })
              }}
              className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm text-foreground"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={sortKey(option)} value={sortKey(option)}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2" aria-label="Active filters">
            {activeFilters.map((filter) => (
              <FilterChip key={filter.key} text={filter.text} onRemove={filter.onRemove} />
            ))}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>We couldn't load your engagements.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch?.()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && engagements.length > 0 && (
        <div className="flex flex-col gap-0.5" aria-live="polite">
          <p className="text-xs text-muted-foreground">{resultCount}</p>
          {hiddenNoDate.map(({ field, count }) => (
            <p key={field} className="text-xs text-amber-700">
              {count} engagement{count === 1 ? "" : "s"} with no {DATE_FIELDS[field].noun}{" "}
              {count === 1 ? "is" : "are"} hidden by the {DATE_FIELDS[field].label.toLowerCase()}{" "}
              filter. Choose "{DATE_FIELDS[field].noneLabel}" in that filter to see{" "}
              {count === 1 ? "it" : "them"}.
            </p>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-background">
        {/* ── Phones: stacked cards ─────────────────────────────────────── */}
        <div className="md:hidden">
          {isLoading && (
            <ul className="divide-y" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <li key={i} className="flex flex-col gap-2.5 p-4">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </li>
              ))}
            </ul>
          )}

          {!isLoading && paginatedEngagements.length > 0 && (
            <ul className="divide-y">
              {paginatedEngagements.map((e) => (
                <EngagementCard
                  key={e.id}
                  engagement={e}
                  navigate={navigate}
                  highlightedId={highlightedId}
                />
              ))}
            </ul>
          )}

          {hasNoEngagements && <div className="px-4 py-14 text-center">{emptyState}</div>}
          {hasNoMatches && <div className="px-4 py-10 text-center">{noMatches}</div>}
        </div>

        {/* ── Tablet and up: table ──────────────────────────────────────── */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] table-fixed text-sm">
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[26%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
              <col className="w-[18%]" />
              <col className="w-[6%]" />
            </colgroup>
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-foreground">
                <th className="px-4 py-3.5 align-middle font-medium">Engagement</th>
                <th className="px-4 py-3.5 align-middle font-medium">Service</th>
                <th className="px-4 py-3.5 align-middle font-medium" aria-sort={ariaSort(CREATED)}>
                  <SortHeader field={CREATED} sort={sort} onSort={handleHeaderSort} />
                </th>
                <th className="px-4 py-3.5 align-middle font-medium" aria-sort={ariaSort(DUE)}>
                  <SortHeader field={DUE} sort={sort} onSort={handleHeaderSort} />
                </th>
                <th className="px-4 py-3.5 align-middle font-medium">Status</th>
                <th className="px-4 py-3.5" aria-hidden="true" />
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} className="border-b last:border-b-0" aria-hidden="true">
                    {[0, 1, 2, 3, 4, 5].map((cell) => (
                      <td key={cell} className="px-4 py-5">
                        <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                paginatedEngagements.map((e) => (
                  <tr
                    key={e.id}
                    {...getRowProps(e, navigate, highlightedId)}
                    className={cn(
                      "group cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/30 focus-within:bg-muted/30",
                      highlightClass
                    )}
                  >
                    <td className="px-4 py-4 align-middle">
                      <p className="truncate font-medium">
                        <EngagementLink engagement={e} />
                      </p>
                      {e.category && (
                        <p className="truncate text-xs text-muted-foreground">{e.category}</p>
                      )}
                    </td>
                    <td className="px-4 py-4 align-middle font-medium">
                      <span className="line-clamp-2">{e.serviceName}</span>
                    </td>
                    <td className="px-4 py-4 align-middle text-muted-foreground">
                      {formatDate(e.createdAt)}
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <DueDate engagement={e} />
                    </td>
                    <td className="px-4 py-4 align-middle">
                      <EngagementStatusBadge status={stageLabel(e.status)} />
                    </td>
                    <td className="px-4 py-4 text-right align-middle">
                      <ChevronRight
                        className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                        aria-hidden="true"
                      />
                    </td>
                  </tr>
                ))}

              {hasNoEngagements && (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    {emptyState}
                  </td>
                </tr>
              )}

              {hasNoMatches && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center">
                    {noMatches}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      
      </div>
        <PaginationFooter
          page={visiblePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
    </div>
  )
}
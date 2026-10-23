import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { ChevronRight, FolderOpen, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePageMeta } from "@/hooks/usePageMeta"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyEngagements } from "@/hooks/useEngagements"
import { authStore } from "@/store/authStore"
import { EngagementStatusBadge } from "@/components/firm/engagements/engagement-status-badge"
import { formatDate } from "@/components/firm/engagements/engagement-variants"


const statusMeta = {
  pending: { label: "Under Review", tone: "blue" },
  active: { label: "Documents Needed", tone: "amber" },
  completed: { label: "Completed", tone: "green" },
  cancelled: { label: "Cancelled", tone: "gray" },
}

const ALL_STATUSES = "All Statuses"
const ALL_SERVICES = "All Services"
const CLOSED_STATUSES = ["completed", "cancelled"]
const HIGHLIGHT_MS = 3000

const getStatusMeta = (status) =>
  statusMeta[status] ?? { label: status || "Unknown", tone: "gray" }

// Turns the due date into a label + tone so overdue / due-soon engagements
// stand out, and finished ones stay quiet.
function getDueInfo(engagement) {
  if (!engagement.targetEndDate) return { label: "—", hint: "", tone: "muted" }

  const label = formatDate(engagement.targetEndDate)
  if (CLOSED_STATUSES.includes(engagement.status)) return { label, hint: "", tone: "muted" }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(engagement.targetEndDate)
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

// Props that turn a row / card into a keyboard-accessible link, and tag it so
// the highlight effect can find it.
function getRowProps(engagement, navigate, highlightedId) {
  const path = `/client/engagements/${engagement.id}`
  const go = () => navigate(path)
  return {
    role: "link",
    tabIndex: 0,
    "aria-label": `Open engagement ${engagement.engagementNumber ?? ""}`.trim(),
    "data-engagement-id": engagement.id,
    "data-highlighted": highlightedId === engagement.id ? "true" : undefined,
    onClick: go,
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        go()
      }
    },
  }
}

const highlightClass =
  "data-[highlighted=true]:bg-emerald-50 data-[highlighted=true]:ring-2 data-[highlighted=true]:ring-inset data-[highlighted=true]:ring-emerald-500"

function EngagementCard({ engagement, navigate, highlightedId }) {
  const status = getStatusMeta(engagement.status)
  return (
    <li
      {...getRowProps(engagement, navigate, highlightedId)}
      className={cn(
        "flex cursor-pointer flex-col gap-2 p-4 transition-colors hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600/40",
        highlightClass
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{engagement.engagementNumber}</p>
        <EngagementStatusBadge status={status.label} />
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
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES)
  const [typeFilter, setTypeFilter] = useState(ALL_SERVICES)

  // Set by the Service Requests page when the client picks an approved request.
  const [highlightedId, setHighlightedId] = useState(
    () => location.state?.highlightEngagementId ?? null
  )

  const statusOptions = useMemo(() => {
    const known = Object.values(statusMeta).map(({ label }) => label)
    const extra = engagements
      .map((e) => getStatusMeta(e.status).label)
      .filter((label) => !known.includes(label))
    return [ALL_STATUSES, ...known, ...new Set(extra)]
  }, [engagements])

  const typeOptions = useMemo(() => {
    const categories = engagements.map((e) => e.category).filter(Boolean)
    return [ALL_SERVICES, ...[...new Set(categories)].sort()]
  }, [engagements])

  const filteredEngagements = useMemo(() => {
    const query = search.trim().toLowerCase()
    return engagements
      .filter((e) => {
        const status = getStatusMeta(e.status)
        const matchesSearch =
          !query ||
          [e.engagementNumber, e.serviceName, e.category].some((field) =>
            field?.toLowerCase().includes(query)
          )
        const matchesStatus = statusFilter === ALL_STATUSES || status.label === statusFilter
        const matchesType = typeFilter === ALL_SERVICES || e.category === typeFilter
        return matchesSearch && matchesStatus && matchesType
      })
      .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
  }, [engagements, search, statusFilter, typeFilter])

  const hasActiveFilters =
    search.trim() !== "" || statusFilter !== ALL_STATUSES || typeFilter !== ALL_SERVICES

  const clearFilters = () => {
    setSearch("")
    setStatusFilter(ALL_STATUSES)
    setTypeFilter(ALL_SERVICES)
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
    breadcrumbs: [{ label: "Home", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
  })

  const hasNoEngagements = !isLoading && !error && engagements.length === 0
  const hasNoMatches = !isLoading && engagements.length > 0 && filteredEngagements.length === 0

  const emptyState = (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <FolderOpen className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">No engagements yet</p>
      <p className="text-xs text-muted-foreground">
        Once your firm approves a service request, your engagement will appear here.
      </p>
      <Button asChild size="sm" className="mt-2">
        <Link to="/client/service-requests?new=1">Request a Service</Link>
      </Button>
    </div>
  )

  const noMatches = (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-muted-foreground">No engagements match your filters.</p>
      <button
        type="button"
        onClick={clearFilters}
        className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
      >
        Clear filters
      </button>
    </div>
  )

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2">
      <div>
        <h1 className="text-xl font-semibold">My Engagements</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {engagements.length} total engagement{engagements.length === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full min-w-55 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search engagements..."
            aria-label="Search engagements"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by service type"
          className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          {typeOptions.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
          >
            Clear filters
          </button>
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

          {!isLoading && filteredEngagements.length > 0 && (
            <ul className="divide-y">
              {filteredEngagements.map((e) => (
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
              <tr className="border-b bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3.5 align-middle font-medium">Engagement</th>
                <th className="px-4 py-3.5 align-middle font-medium">Service</th>
                <th className="px-4 py-3.5 align-middle font-medium">Created</th>
                <th className="px-4 py-3.5 align-middle font-medium">Due Date</th>
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
                filteredEngagements.map((e) => {
                  const status = getStatusMeta(e.status)
                  return (
                    <tr
                      key={e.id}
                      {...getRowProps(e, navigate, highlightedId)}
                      className={cn(
                        "group cursor-pointer border-b transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600/40",
                        highlightClass
                      )}
                    >
                      <td className="px-4 py-4 align-middle">
                        <p className="truncate font-medium">{e.engagementNumber}</p>
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
                        <EngagementStatusBadge status={status.label} />
                      </td>
                      <td className="px-4 py-4 text-right align-middle">
                        <ChevronRight
                          className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                          aria-hidden="true"
                        />
                      </td>
                    </tr>
                  )
                })}

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
    </div>
  )
}
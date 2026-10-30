import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ChevronRight,
  ClipboardList,
  MessageSquareText,
  Search,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { PaginationFooter, PAGE_SIZE } from "@/components/shared/pagination-footer"
import { usePageMeta } from "@/hooks/usePageMeta"
import { authStore } from "@/store/authStore"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyServiceRequests } from "@/hooks/useServiceRequests"
import { useFetchMyEngagements } from "@/hooks/useEngagements"

const statusMeta = {
  pending: {
    label: "Pending Review",
    tone: "amber",
    help: "Your firm hasn't reviewed this request yet.",
  },
  approved: {
    label: "Approved",
    tone: "blue",
    help: "Your firm accepted this request. Open it to see the engagement and its requirements.",
  },
  "in-progress": {
    label: "In Progress",
    tone: "blue",
    help: "Your firm is working on this request.",
  },
  rejected: {
    label: "Declined",
    tone: "red",
    help: "Your firm couldn't take this request. Open it to see the reason.",
  },
  cancelled: {
    label: "Cancelled",
    tone: "gray",
    help: "This request was cancelled.",
  },
}

const toneClass = {
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-600",
}

const FILTER_TABS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
]

// Only these requests open an engagement when clicked. Add "in-progress" here
// if those rows should be clickable too.
const CLICKABLE_STATUSES = ["approved"]

// Declined requests open the "reason for decline" dialog when clicked.
const DECLINED_STATUS = "rejected"

function matchesTab(status, tab) {
  switch (tab) {
    case "pending":
      return status === "pending"
    case "active":
      return status === "approved" || status === "in-progress"
    case "rejected":
      return status === "rejected"
    default:
      return true
  }
}

const formatDate = (isoString) =>
  isoString
    ? new Date(isoString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—"

// The reason the firm gave when declining a request. Only decline-specific
// field names are read on purpose, so the client's own notes on the request
// are never shown as if they were the firm's reason.
// If your API names these differently, change them here (only place).
function getDeclineRemark(request) {
  const raw =
    request.rejectionReason ??
    request.rejection_reason ??
    request.rejectionRemarks ??
    request.rejection_remarks ??
    request.declineReason ??
    request.decline_reason ??
    request.declineRemarks ??
    request.decline_remarks ??
    null
  const text = typeof raw === "string" ? raw.trim() : ""
  return text || null
}

// When the request was declined, if the API provides it.
function getDeclinedDate(request) {
  return (
    request.rejectedAt ??
    request.rejected_at ??
    request.declinedAt ??
    request.declined_at ??
    null
  )
}

// Finds the engagement that was created from a request.
// 1) The request itself may carry the engagement id.
// 2) Otherwise match it against the client's engagements by the request id.
// If your API uses different field names, change them here (only place).
function getEngagementId(request, engagements) {
  const direct =
    request.engagementId ?? request.engagement_id ?? request.engagement?.id ?? null
  if (direct) return direct

  const match = engagements.find(
    (e) =>
      (e.serviceRequestId ?? e.service_request_id ?? e.requestId ?? e.request_id) === request.id
  )
  return match?.id ?? null
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] ?? { label: status, tone: "gray", help: "" }
  return (
    <span
      title={meta.help}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneClass[meta.tone]
      )}
    >
      {meta.label}
    </span>
  )
}

// Props that turn a row / card into a keyboard-accessible control:
//   - declined request  -> opens the reason dialog (role "button")
//   - request with path -> opens its engagement (role "link")
//   - anything else     -> plain, non-clickable row
function getRowProps(request, path, navigate, openRemark) {
  const isDeclined = request.status === DECLINED_STATUS
  if (!isDeclined && !path) return {}

  const activate = isDeclined ? () => openRemark(request) : () => navigate(path)
  const number = request.requestNumber ?? ""

  return {
    role: isDeclined ? "button" : "link",
    tabIndex: 0,
    "aria-label": isDeclined
      ? `View why request ${number} was declined`.replace("  ", " ")
      : `Open engagement for request ${number}`.trim(),
    onClick: activate,
    onKeyDown: (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        activate()
      }
    },
  }
}

const clickableRowClass =
  "group cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600/40"

const detailLabelClass =
  "text-xs font-medium uppercase tracking-wide text-muted-foreground"

// Small original illustration for the dialog: a request form with a declined
// mark, on a soft blob. Pure SVG, colored with the app's red scale.
function DeclinedIllustration() {
  return (
    <svg
      viewBox="0 0 320 180"
      className="h-40 w-auto sm:h-44"
      aria-hidden="true"
      focusable="false"
    >
      {/* soft blob */}
      <path
        className="fill-red-50"
        d="M58 98C48 58 108 28 170 36c60 8 112 2 122 52 9 46-42 78-102 78-62 0-122-14-132-68Z"
      />

      {/* scattered accents */}
      <g className="stroke-red-200" fill="none" strokeWidth="2" strokeLinecap="round">
        <circle cx="38" cy="58" r="6" />
        <circle cx="272" cy="28" r="5" />
        <circle cx="304" cy="122" r="4" />
        <path d="M90 20v10M85 25h10" />
        <path d="M250 154v10M245 159h10" />
        <path d="M28 118v8M24 122h8" />
      </g>
      <g className="stroke-red-100" fill="none" strokeWidth="4" strokeLinecap="round">
        <path d="M14 92h42" />
        <path d="M268 104h40" />
      </g>

      {/* shadow */}
      <ellipse className="fill-red-900/10" cx="160" cy="170" rx="58" ry="5" />

      {/* request form */}
      <rect className="fill-white" x="115" y="42" width="90" height="116" rx="10" />
      <path
        className="fill-red-100"
        d="M125 42h70a10 10 0 0 1 10 10v12H115V52a10 10 0 0 1 10-10Z"
      />
      <rect
        className="stroke-red-500"
        x="115"
        y="42"
        width="90"
        height="116"
        rx="10"
        fill="none"
        strokeWidth="3"
      />
      <g className="stroke-red-200" strokeWidth="4" strokeLinecap="round">
        <path d="M130 84h56" />
        <path d="M130 98h40" />
        <path d="M130 112h48" />
      </g>

      {/* declined mark */}
      <circle className="fill-red-500 stroke-white" cx="206" cy="140" r="25" strokeWidth="4" />
      <path
        d="M197 131l18 18M215 131l-18 18"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  )
}

// Shows why a request was declined. Centered layout with a soft illustration
// on top. `sm:max-w-2xl` is needed because the Dialog's own `sm:max-w-lg`
// would win over a plain `max-w-*`.
function DeclineRemarkDialog({ open, onOpenChange, request }) {
  if (!request) return null

  const remark = getDeclineRemark(request)
  const declinedAt = getDeclinedDate(request)

  const meta = [
    request.requestNumber,
    `Requested ${formatDate(request.createdAt)}`,
    declinedAt ? `Declined ${formatDate(declinedAt)}` : null,
  ].filter(Boolean)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-y-auto rounded-2xl p-0 sm:max-w-2xl">
        <div aria-hidden="true" className="h-1.5 shrink-0 bg-red-500" />

        <div className="flex flex-col items-center px-6 pt-8 pb-8 text-center sm:px-12">
          <DeclinedIllustration />

          <DialogTitle className="mt-4 text-xl font-semibold tracking-tight">
            Request declined
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {request.serviceName}
          </DialogDescription>
          <p className="mt-2 text-xs text-muted-foreground">{meta.join("  ·  ")}</p>

          <div className="mt-6 w-full max-w-lg text-left">
            <p className={detailLabelClass}>Reason from your firm</p>
            {remark ? (
              <p className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-red-100 bg-red-50/60 px-4 py-3 text-sm leading-relaxed break-words whitespace-pre-line text-red-900">
                {remark}
              </p>
            ) : (
              <p className="mt-2 flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Your firm didn't leave a reason for this decision. You can contact them if
                you'd like to know more.
              </p>
            )}
          </div>

          <Button
            type="button"
            className="mt-7 min-w-36 rounded-full bg-red-600 px-8 text-white hover:bg-red-700"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            Questions about this decision? Contact your firm.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Phone version of one request. The status help text is printed as visible
// text (the table's `title` tooltip doesn't work on touch screens).
function RequestCard({ request, path, navigate, openRemark }) {
  const meta = statusMeta[request.status]
  const isDeclined = request.status === DECLINED_STATUS
  const remark = isDeclined ? getDeclineRemark(request) : null
  const interactive = isDeclined || Boolean(path)

  return (
    <li
      {...getRowProps(request, path, navigate, openRemark)}
      className={cn("flex flex-col gap-2 p-4", interactive && clickableRowClass)}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{request.requestNumber}</p>
        <StatusBadge status={request.status} />
      </div>

      <p className="text-sm font-medium">{request.serviceName}</p>
      <p className="text-xs text-muted-foreground">Requested {formatDate(request.createdAt)}</p>

      {isDeclined ? (
        <div className="mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="line-clamp-2 text-xs text-red-800">
            {remark ?? "Your firm didn't leave a reason for this decision."}
          </p>
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-red-700">
            <MessageSquareText className="size-3.5" aria-hidden="true" />
            View full reason
          </p>
        </div>
      ) : (
        meta?.help && <p className="text-xs text-muted-foreground">{meta.help}</p>
      )}

      {path && (
        <p className="flex items-center gap-1 text-xs font-medium text-emerald-700">
          View engagement
          <ChevronRight className="size-3.5" aria-hidden="true" />
        </p>
      )}
    </li>
  )
}

export default function ClientServiceRequestsPage() {
  const navigate = useNavigate()
  const user = authStore((state) => state.user)
  const { data: business } = useFetchMyBusiness(user?.id)
  const businessId = business?.id

  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [page, setPage] = useState(1)

  // The request is kept after the dialog closes so its content doesn't blank
  // out during the closing animation.
  const [remarkOpen, setRemarkOpen] = useState(false)
  const [remarkRequest, setRemarkRequest] = useState(null)

  const openRemark = (request) => {
    setRemarkRequest(request)
    setRemarkOpen(true)
  }

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useFetchMyServiceRequests(businessId)
  const { data: engagements = [] } = useFetchMyEngagements(businessId)

  const tabCounts = useMemo(
    () =>
      Object.fromEntries(
        FILTER_TABS.map((tab) => [
          tab.value,
          requests.filter((r) => matchesTab(r.status, tab.value)).length,
        ])
      ),
    [requests]
  )

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests.filter((r) => {
      if (!matchesTab(r.status, activeTab)) return false
      if (!query) return true
      return [r.requestNumber, r.serviceName, r.category].some((field) =>
        field?.toLowerCase().includes(query)
      )
    })
  }, [requests, activeTab, search])

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE))
  const visiblePage = Math.min(page, totalPages)
  const paginatedRequests = filteredRequests.slice(
    (visiblePage - 1) * PAGE_SIZE,
    visiblePage * PAGE_SIZE
  )

  // request id -> where clicking it goes (undefined = not clickable).
  // The engagement page opens on the Overview tab, which holds the task list.
  const pathByRequest = useMemo(() => {
    const paths = {}
    requests.forEach((r) => {
      if (!CLICKABLE_STATUSES.includes(r.status)) return
      const engagementId = getEngagementId(r, engagements)
      // No match found: send them to their engagements list instead of a dead row.
      paths[r.id] = engagementId ? `/client/engagements/${engagementId}` : "/client/engagements"
    })
    return paths
  }, [requests, engagements])

  usePageMeta({
    title: "Service Requests",
    breadcrumbs: [{ label: "Home", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
  })

  const hasNoRequests = !isLoading && !error && requests.length === 0
  const hasNoMatches = !isLoading && requests.length > 0 && filteredRequests.length === 0

  const emptyState = (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <ClipboardList className="size-5" />
      </div>
      <p className="text-sm font-medium text-foreground">No service requests yet</p>
      <p className="text-xs text-muted-foreground">
        Service requests will appear here once they are submitted.
      </p>
    </div>
  )

  const noMatchesText = search.trim()
    ? `No requests match "${search.trim()}".`
    : "No requests in this view."

  return (
    <div className="flex flex-1 flex-col gap-5 px-2 py-2">
      <div>
        <h1 className="text-xl font-semibold">My Service Requests</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {requests.length} total request{requests.length === 1 ? "" : "s"}
          {" · "}Approved requests open their engagement. Declined requests show
          the reason.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* overflow-y-hidden stops the 1px underline overhang (-mb-px) from
            creating a tiny vertical scrollbar with up/down arrows. */}
        <div
          role="tablist"
          aria-label="Filter requests by status"
          className="flex gap-4 overflow-x-auto overflow-y-hidden border-b sm:gap-6"
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.value}
              onClick={() => {
                setActiveTab(tab.value)
                setPage(1)
              }}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 pb-2 text-sm font-medium transition-colors",
                activeTab === tab.value
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                {tabCounts[tab.value]}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            aria-label="Search requests"
            className="pl-8"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>We couldn't load your service requests.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
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

          {!isLoading && filteredRequests.length > 0 && (
            <ul className="divide-y">
              {paginatedRequests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  path={pathByRequest[r.id]}
                  navigate={navigate}
                  openRemark={openRemark}
                />
              ))}
            </ul>
          )}

          {hasNoRequests && <div className="px-4 py-14 text-center">{emptyState}</div>}

          {hasNoMatches && (
            <p className="px-4 py-10 text-center text-sm text-muted-foreground">{noMatchesText}</p>
          )}
        </div>

        {/* ── Tablet and up: table ──────────────────────────────────────── */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] table-fixed text-sm">
            <colgroup>
              <col className="w-[28%]" />
              <col className="w-[38%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3.5 align-middle font-semibold">Request</th>
                <th className="px-4 py-3.5 align-middle font-semibold">Service</th>
                <th className="px-4 py-3.5 text-center align-middle font-semibold">Status</th>
                <th className="px-4 py-3.5 align-middle font-semibold">Requested</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i} className="border-b border-border/60 last:border-b-0" aria-hidden="true">
                    {[0, 1, 2, 3].map((cell) => (
                      <td key={cell} className="px-4 py-5">
                        <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-muted" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading &&
                paginatedRequests.map((r) => {
                  const path = pathByRequest[r.id]
                  const isDeclined = r.status === DECLINED_STATUS
                  const interactive = isDeclined || Boolean(path)
                  return (
                    <tr
                      key={r.id}
                      {...getRowProps(r, path, navigate, openRemark)}
                      className={cn(
                        "border-b border-border/60 last:border-b-0",
                        interactive ? clickableRowClass : "hover:bg-muted/30"
                      )}
                    >
                      <td className="px-4 py-4 align-middle">
                        <p className="truncate font-medium">{r.requestNumber}</p>
                      </td>
                      <td className="px-4 py-4 align-middle font-medium">
                        <span className="line-clamp-2">{r.serviceName}</span>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <StatusBadge status={r.status} />
                          {isDeclined && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 group-hover:underline">
                              <MessageSquareText className="size-3" aria-hidden="true" />
                              View reason
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </td>
                    </tr>
                  )
                })}

              {hasNoRequests && (
                <tr>
                  <td colSpan={4} className="px-4 py-14 text-center">
                    {emptyState}
                  </td>
                </tr>
              )}

              {hasNoMatches && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    {noMatchesText}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <PaginationFooter
          page={visiblePage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      <DeclineRemarkDialog
        open={remarkOpen}
        onOpenChange={setRemarkOpen}
        request={remarkRequest}
      />
    </div>
  )
}
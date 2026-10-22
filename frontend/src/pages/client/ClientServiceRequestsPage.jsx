import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { ArrowRight, ClipboardList, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { NewServiceRequestForm } from "@/components/firm/service-requests/NewServiceRequestForm"
import { usePageMeta } from "@/hooks/usePageMeta"
import { authStore } from "@/store/authStore"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyServiceRequests, useCancelServiceRequest } from "@/hooks/useServiceRequests"

// Clients can only cancel while the firm hasn't acted on the request yet.
// Once it's approved, the work belongs to the engagement.
const CANCELLABLE_STATUSES = ["pending"]

// Statuses where the client can jump straight to the engagement.
const ENGAGEMENT_STATUSES = ["approved", "in-progress"]

const statusMeta = {
  pending: {
    label: "Pending Review",
    tone: "amber",
    help: "Your firm hasn't reviewed this request yet. You can still cancel it.",
  },
  approved: {
    label: "Approved",
    tone: "blue",
    help: "Your firm accepted this request. Track progress in My Engagements.",
  },
  "in-progress": {
    label: "In Progress",
    tone: "blue",
    help: "Your firm is working on this request.",
  },
  rejected: {
    label: "Declined",
    tone: "red",
    help: "Your firm couldn't take this request.",
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
  { value: "closed", label: "Closed" },
]

function matchesTab(status, tab) {
  switch (tab) {
    case "pending":
      return status === "pending"
    case "active":
      return status === "approved" || status === "in-progress"
    case "closed":
      return status === "rejected" || status === "cancelled"
    default:
      return true
  }
}

const formatDate = (isoString) =>
  isoString
    ? new Date(isoString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—"

function StatusBadge({ status }) {
  const meta = statusMeta[status] ?? { label: status, tone: "gray", help: "" }
  return (
    <span
      title={meta.help}
      className={cn(
        "inline-flex cursor-help items-center rounded-full px-2 py-0.5 text-xs font-medium",
        toneClass[meta.tone]
      )}
    >
      {meta.label}
    </span>
  )
}

function RequestAction({ request, isCancelling, onCancel }) {
  const canCancel = CANCELLABLE_STATUSES.includes(request.status)
  const canViewEngagement = ENGAGEMENT_STATUSES.includes(request.status)

  if (canCancel) {
    return (
      <Button
        variant="destructive"
        size="sm"
        disabled={isCancelling}
        onClick={() => onCancel(request)}
        className="gap-1.5 whitespace-nowrap"
      >
        <X className="size-3.5" />
        {isCancelling ? "Cancelling…" : "Cancel"}
      </Button>
    )
  }

  if (canViewEngagement) {
    const href = request.engagementId
      ? `/client/engagements/${request.engagementId}`
      : "/client/engagements"
    return (
      <Link
        to={href}
        className="inline-flex h-8 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-background px-3 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2"
      >
        View
        <ArrowRight className="size-3.5 shrink-0" />
      </Link>
    )
  }

  return <span className="text-xs text-muted-foreground">—</span>
}

// Phone version of one request. The status help text is printed as visible
// text (the table's `title` tooltip doesn't work on touch screens).
function RequestCard({ request, isCancelling, onCancel }) {
  const meta = statusMeta[request.status]
  const hasAction =
    CANCELLABLE_STATUSES.includes(request.status) ||
    ENGAGEMENT_STATUSES.includes(request.status)

  return (
    <li className="flex flex-col gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-semibold">{request.requestNumber}</p>
        <StatusBadge status={request.status} />
      </div>

      <p className="text-sm font-medium">{request.serviceName}</p>
      <p className="text-xs text-muted-foreground">Requested {formatDate(request.createdAt)}</p>

      {meta?.help && <p className="text-xs text-muted-foreground">{meta.help}</p>}

      {hasAction && (
        <div className="mt-1 flex [&>*]:h-9 [&>*]:flex-1">
          <RequestAction request={request} isCancelling={isCancelling} onCancel={onCancel} />
        </div>
      )}
    </li>
  )
}

export default function ClientServiceRequestsPage() {
  const user = authStore((state) => state.user)
  const { data: business } = useFetchMyBusiness(user?.id)
  const businessId = business?.id
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelError, setCancelError] = useState("")

  const {
    data: requests = [],
    isLoading,
    error,
    refetch,
  } = useFetchMyServiceRequests(businessId)
  const cancelRequest = useCancelServiceRequest()

  // Lets other pages link straight to the dialog: /client/service-requests?new=1
  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setIsNewRequestOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

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

  const askToCancel = (request) => {
    setCancelError("")
    setCancelTarget(request)
  }

  const confirmCancel = () => {
    if (!cancelTarget) return
    cancelRequest.mutate(cancelTarget.id, {
      onSuccess: () => setCancelTarget(null),
      onError: () =>
        setCancelError("We couldn't cancel this request. Please try again."),
    })
  }

  const closeCancelDialog = (open) => {
    if (open || cancelRequest.isPending) return
    setCancelTarget(null)
    setCancelError("")
  }

  const openNewRequest = useCallback(() => setIsNewRequestOpen(true), [])

  usePageMeta({
    title: "Service Requests",
    breadcrumbs: [{ label: "Home", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
    onRequestServiceClick: openNewRequest,
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
        Tell your firm what you need and we'll get started.
      </p>
      <Button type="button" size="sm" className="mt-2" onClick={openNewRequest}>
        Request a Service
      </Button>
    </div>
  )

  const noMatchesText = search.trim()
    ? `No requests match "${search.trim()}".`
    : "No requests in this view."

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 px-2 py-2">
        <div>
          <h1 className="text-xl font-semibold">My Service Requests</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {requests.length} total request{requests.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div
            role="tablist"
            aria-label="Filter requests by status"
            className="flex gap-4 overflow-x-auto border-b sm:gap-6"
          >
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
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
              onChange={(e) => setSearch(e.target.value)}
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
                {filteredRequests.map((r) => (
                  <RequestCard
                    key={r.id}
                    request={r}
                    isCancelling={cancelRequest.isPending && cancelTarget?.id === r.id}
                    onCancel={askToCancel}
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
            <table className="w-full min-w-[720px] table-fixed text-sm">
              <colgroup>
                <col className="w-[24%]" />
                <col className="w-[32%]" />
                <col className="w-[16%]" />
                <col className="w-[14%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                  <th className="px-4 py-3.5 align-middle font-semibold">Request</th>
                  <th className="px-4 py-3.5 align-middle font-semibold">Service</th>
                  <th className="px-4 py-3.5 text-center align-middle font-semibold">Status</th>
                  <th className="px-4 py-3.5 align-middle font-semibold">Requested</th>
                  <th className="px-4 py-3.5 text-center align-middle font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {isLoading &&
                  [0, 1, 2, 3].map((i) => (
                    <tr key={i} className="border-b border-border/60 last:border-b-0" aria-hidden="true">
                      {[0, 1, 2, 3, 4].map((cell) => (
                        <td key={cell} className="px-4 py-5">
                          <div className="mx-auto h-3 w-3/4 animate-pulse rounded bg-muted" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!isLoading &&
                  filteredRequests.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-border/60 last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-4 align-middle">
                        <p className="truncate font-medium">{r.requestNumber}</p>
                      </td>
                      <td className="px-4 py-4 align-middle font-medium">
                        <span className="line-clamp-2">{r.serviceName}</span>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <RequestAction
                          request={r}
                          isCancelling={cancelRequest.isPending && cancelTarget?.id === r.id}
                          onCancel={askToCancel}
                        />
                      </td>
                    </tr>
                  ))}

                {hasNoRequests && (
                  <tr>
                    <td colSpan={5} className="px-4 py-14 text-center">
                      {emptyState}
                    </td>
                  </tr>
                )}

                {hasNoMatches && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                      {noMatchesText}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Confirm cancel dialog ─────────────────────────────────────────── */}
      <Dialog open={Boolean(cancelTarget)} onOpenChange={closeCancelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this request?</DialogTitle>
            <DialogDescription>
              {cancelTarget?.requestNumber} · {cancelTarget?.serviceName}
              <br />
              This can't be undone. You'll need to submit a new request if you change your mind.
            </DialogDescription>
          </DialogHeader>

          {cancelError && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {cancelError}
            </p>
          )}

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={cancelRequest.isPending}
              onClick={() => closeCancelDialog(false)}
            >
              Keep request
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelRequest.isPending}
              onClick={confirmCancel}
            >
              {cancelRequest.isPending ? "Cancelling…" : "Cancel request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── New request dialog ────────────────────────────────────────────── */}
      <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Service Request</DialogTitle>
            <DialogDescription>Tell us what you need and we'll get started.</DialogDescription>
          </DialogHeader>

          <NewServiceRequestForm
            businessId={businessId}
            onSubmitted={() => setIsNewRequestOpen(false)}
            onCancel={() => setIsNewRequestOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
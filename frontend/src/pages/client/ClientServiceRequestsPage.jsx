import { useCallback, useState } from "react"
import { Briefcase, Eye, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NewServiceRequestForm } from "@/components/firm/service-requests/NewServiceRequestForm"
import { usePageMeta } from "@/hooks/usePageMeta"
import { authStore } from "@/store/authStore"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyServiceRequests, useCancelServiceRequest } from "@/hooks/useServiceRequests"

// Requests can still be cancelled by the client while pending, approved,
// or actively in progress. Once declined, there's nothing left to cancel.
const CANCELLABLE_STATUSES = ["pending", "approved", "in-progress"]

// Declined requests never show a Cancel action at all.
const DECLINED_STATUS = "rejected"

const statusMeta = {
  pending: { label: "Pending Review", tone: "amber" },
  approved: { label: "Approved", tone: "blue" },
  "in-progress": { label: "In Progress", tone: "blue" },
  rejected: { label: "Declined", tone: "red" },
  cancelled: { label: "Cancelled", tone: "gray" },
}

const toneClass = {
  amber: "bg-amber-50 text-amber-700",
  blue: "bg-blue-50 text-blue-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-600",
}

const formatDate = (isoString) =>
  isoString
    ? new Date(isoString).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "—"

export default function ClientServiceRequestsPage() {
  const user = authStore((state) => state.user)
  const { data: business } = useFetchMyBusiness(user?.id)
  const businessId = business?.id

  const [search, setSearch] = useState("")
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)

  const { data: requests = [], isLoading, error } = useFetchMyServiceRequests(businessId)
  const cancelRequest = useCancelServiceRequest()

  const handleCancelRequest = (id) => {
    cancelRequest.mutate(id)
  }

  const filteredRequests = requests.filter((r) =>
    [r.requestNumber, r.serviceName, r.category].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  )

  const openNewRequest = useCallback(() => setIsNewRequestOpen(true), [])

  usePageMeta({
    title: "Service Requests",
    breadcrumbs: [{ label: "Home", href: "/client/dashboard" }],
    hasUnreadNotifications: true,
    onRequestServiceClick: openNewRequest,
  })

  return (
    <>
      <div className="flex flex-1 flex-col gap-5 px-2 py-2">
        <div>
          <h1 className="text-xl font-semibold">My Service Requests</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {requests.length} total requests
          </p>
        </div>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            aria-label="Search requests"
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">Failed to load your service requests.</p>
        )}

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[26%]" />
              <col className="w-[32%]" />
              <col className="w-[16%]" />
              <col className="w-[13%]" />
              <col className="w-[13%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs tracking-wide text-muted-foreground uppercase">
                <th className="px-4 py-3.5 align-middle font-semibold">Request</th>
                <th className="px-4 py-3.5 align-middle font-semibold">Service</th>
                <th className="px-4 py-3.5 align-middle font-semibold">Requested</th>
                <th className="px-4 py-3.5 text-center align-middle font-semibold">View</th>
                <th className="px-4 py-3.5 text-center align-middle font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading your requests…
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredRequests.map((r) => {
                  const meta = statusMeta[r.status] ?? { label: r.status, tone: "gray" }
                  const canCancel = CANCELLABLE_STATUSES.includes(r.status)
                  const isDeclined = r.status === DECLINED_STATUS
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-border/60 last:border-b-0 hover:bg-muted/50"
                    >
                      <td className="px-4 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Briefcase className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.requestNumber}</p>
                            <p className="truncate text-xs text-muted-foreground">{r.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-middle font-medium">
                        <span className="line-clamp-2">{r.serviceName}</span>
                        <span
                          className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneClass[meta.tone]}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-middle text-muted-foreground">
                        {formatDate(r.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        <Button variant="outline" size="sm" className="gap-1.5">
                          <Eye className="size-3.5" />
                          View
                        </Button>
                      </td>
                      <td className="px-4 py-4 text-center align-middle">
                        {isDeclined ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <Button
                            variant={canCancel ? "destructive" : "outline"}
                            size="sm"
                            disabled={!canCancel || cancelRequest.isPending}
                            onClick={() => canCancel && handleCancelRequest(r.id)}
                            className="gap-1.5"
                          >
                            <X className="size-3.5" />
                            Cancel
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}

              {!isLoading && filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No service requests match "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isNewRequestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setIsNewRequestOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-y-auto rounded-2xl bg-background p-6 shadow-lg"
          >
            <div className="mb-2 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">New Service Request</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Tell us what you need and we'll get started.
                </p>
              </div>
              <button
                onClick={() => setIsNewRequestOpen(false)}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            <NewServiceRequestForm
              businessId={businessId}
              onSubmitted={() => setIsNewRequestOpen(false)}
              onCancel={() => setIsNewRequestOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  )
}
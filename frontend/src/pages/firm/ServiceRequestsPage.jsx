import { useEffect, useMemo, useState } from "react"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { DashboardLayout } from "@/layout/DashboardLayout"
import { RequestDetailDialog } from "@/components/firm/service-requests/request-detail-dialog"
import { ServiceRequestFilters } from "@/components/firm/service-requests/service-request-filters"
import { ServiceRequestList } from "@/components/firm/service-requests/service-request-list"
import { serviceRequestStore } from "@/components/firm/service-requests/service-request-store"
import { statusFilterOptions } from "@/components/firm/service-requests/service-request-variants"

/** Smart page for the Firm Service Requests module. Owns all list state and renders the review modal. */
export default function ServiceRequestsPage() {
  const requests = serviceRequestStore((state) => state.requests)
  const setRequestStatus = serviceRequestStore((state) => state.setRequestStatus)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState(null)

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const selectedRequest = requests.find((request) => request.id === selectedId) ?? null

  const statusOptions = useMemo(
    () =>
      statusFilterOptions.map((option) => ({
        ...option,
        count:
          option.value === "all"
            ? requests.length
            : requests.filter((request) => request.status === option.value).length,
      })),
    [requests]
  )

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    return requests.filter((request) => {
      const matchesStatus = statusFilter === "all" || request.status === statusFilter
      const matchesSearch =
        !query ||
        [request.business?.businessName, request.requestNumber, request.serviceName].some((field) =>
          field?.toLowerCase().includes(query)
        )
      return matchesStatus && matchesSearch
    })
  }, [requests, search, statusFilter])

  const openRequest = (request) => setSelectedId(request.id)
  const closeRequest = () => setSelectedId(null)

  const handleApprove = (request) => {
    if (!request) return
    setRequestStatus(request.id, "approved")
  }

  const handleReject = (request) => {
    if (!request) return
    setRequestStatus(request.id, "rejected")
  }

  return (
    <DashboardLayout
      role="firm-admin"
      title="Service Requests"
      breadcrumbs={[
        { label: "Firm Admin", href: "/admin/dashboard" },
        { label: "Service Requests", href: "/admin/service-requests" },
      ]}
    >
      {loading ? (
        <PageSkeleton type="service-requests" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 py-1">
            <p className="text-sm text-muted-foreground">
              Review incoming service requests submitted by clients and decide whether to start an
              engagement.
            </p>
          </div>

          <ServiceRequestFilters
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by client, request no., or service..."
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusOptions={statusOptions}
            resultCount={`${filteredRequests.length} of ${requests.length} requests`}
          />

          <ServiceRequestList
            requests={filteredRequests}
            emptyMessage="No service requests match your filters."
            emptyDescription="Try clearing the search or changing the status filter."
            onRowClick={(request) => openRequest(request)}
            actions={(request) => (
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-lg bg-forest-900 text-white hover:opacity-90"
                onClick={() => openRequest(request)}
              >
                <Eye className="size-4" />
                Review
              </Button>
            )}
          />
        </>
      )}

      <RequestDetailDialog
        open={!!selectedRequest}
        onOpenChange={(open) => {
          if (!open) closeRequest()
        }}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </DashboardLayout>
  )
}

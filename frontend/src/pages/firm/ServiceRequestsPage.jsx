import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"
import { RequestDetailDialog } from "@/components/firm/service-requests/request-detail-dialog"
import { CreateEngagementDialog } from "@/components/firm/service-requests/create-engagement-dialog"
import { RequiredDocumentsDialog } from "@/components/firm/service-requests/required-documents-dialog"
import { ServiceRequestFilters } from "@/components/firm/service-requests/service-request-filters"
import { ServiceRequestList } from "@/components/firm/service-requests/service-request-list"
import { serviceRequestStore } from "@/components/firm/service-requests/service-request-store"
import { statusFilterOptions } from "@/components/firm/service-requests/service-request-variants"
import { engagementStore } from "@/components/firm/engagements/engagement-store"
import { generateEngagementNumber } from "@/components/firm/engagements/engagement-variants"

export default function ServiceRequestsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const requests = serviceRequestStore((state) => state.requests)
  const setRequestStatus = serviceRequestStore((state) => state.setRequestStatus)
  const addEngagement = engagementStore((state) => state.addEngagement)

  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState(null)
  const [engagementRequest, setEngagementRequest] = useState(null)
  const [activeEngagement, setActiveEngagement] = useState(null)

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

  const handleApproveAndEngage = (request) => {
    if (!request) return
    closeRequest()
    setEngagementRequest(request)
  }

  const handleReject = (request) => {
    if (!request) return
    setRequestStatus(request.id, "rejected")
  }

  const handleEngagementSubmit = (values) => {
    setEngagementRequest(null)
    setActiveEngagement(values)
  }

  const handleBackToEngagement = () => {
    setEngagementRequest(activeEngagement)
    setActiveEngagement(null)
  }

  const handleSendToClient = (values) => {
    if (activeEngagement?.requestNumber) {
      const requestId = requests.find((r) => r.requestNumber === activeEngagement.requestNumber)?.id
      if (requestId) setRequestStatus(requestId, "approved")
    }

    const newEngagement = {
      id: `eng-${Date.now()}`,
      engagementNumber: generateEngagementNumber(),
      serviceName: activeEngagement?.serviceName ?? "—",
      serviceFee: activeEngagement?.serviceFee ?? 0,
      startDate: activeEngagement?.startDate ?? "",
      targetEndDate: activeEngagement?.targetEndDate ?? "",
      status: "active",
      assignedStaff: activeEngagement?.assignedStaff ?? "",
      internalNotes: values?.note ?? "",
      documents: [],
      notes: [],
      reviewHistory: [],
      requestNumber: activeEngagement?.requestNumber ?? "",
      client: activeEngagement?.client ?? {},
      business: activeEngagement?.business ?? {},
    }

    addEngagement(newEngagement)
    setActiveEngagement(null)
    navigate(`${basePath}/engagements`)
  }

  usePageMeta({
    title: "Service Requests",
    breadcrumbs: [
      { label: basePath === "/firm" ? "Firm Staff" : "Firm Admin", href: `${basePath}/dashboard` },
      { label: "Service Requests", href: `${basePath}/service-requests` },
    ],
  })

  return (
    <>
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
        onApprove={handleApproveAndEngage}
        onApproveAndEngage={handleApproveAndEngage}
        onReject={handleReject}
      />

      <CreateEngagementDialog
        open={!!engagementRequest}
        onOpenChange={(open) => {
          if (!open) setEngagementRequest(null)
        }}
        request={engagementRequest}
        onSubmit={handleEngagementSubmit}
      />

      <RequiredDocumentsDialog
        open={!!activeEngagement}
        onOpenChange={(open) => {
          if (!open) setActiveEngagement(null)
        }}
        engagement={activeEngagement}
        onBack={handleBackToEngagement}
        onSubmit={handleSendToClient}
      />
    </>
  )
}

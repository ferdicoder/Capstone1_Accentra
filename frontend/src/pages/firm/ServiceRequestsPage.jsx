import { useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { usePageMeta } from "@/hooks/usePageMeta"
import { RequestDetailDialog } from "@/components/firm/service-requests/request-detail-dialog"
import { CreateEngagementDialog } from "@/components/firm/service-requests/create-engagement-dialog"
import { RequiredDocumentsDialog } from "@/components/firm/service-requests/required-documents-dialog"
import { ServiceRequestFilters } from "@/components/firm/service-requests/service-request-filters"
import { ServiceRequestList } from "@/components/firm/service-requests/service-request-list"
import { statusFilterOptions } from "@/components/firm/service-requests/service-request-variants"
import { engagementStore } from "@/components/firm/engagements/engagement-store" // still mocked — no engagements API yet
import { generateEngagementNumber } from "@/components/firm/engagements/engagement-variants"
import { useFetchServiceRequests, useUpdateServiceRequestStatus } from "@/hooks/useServiceRequests"
import { useCreateEngagementFromRequest } from "@/hooks/useEngagements"

export default function ServiceRequestsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"

  const { data: requests = [], isLoading, error } = useFetchServiceRequests()
  const updateStatus = useUpdateServiceRequestStatus()
  const addEngagement = engagementStore((state) => state.addEngagement)

  const createEngagement = useCreateEngagementFromRequest();

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedId, setSelectedId] = useState(null)
  const [engagementRequest, setEngagementRequest] = useState(null)
  const [activeEngagement, setActiveEngagement] = useState(null)

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
    updateStatus.mutate({ id: request.id, status: "rejected" })
  }

  const handleEngagementSubmit = (values) => {
    if (!engagementRequest) return

    createEngagement.mutate(
      {
        serviceRequestId: engagementRequest.id,
        assignedStaff: values.assignedStaff,
        startDate: values.startDate,
        dueDate: values.targetEndDate,
        fee: values.serviceFee,
      },
      {
        onSuccess: (newEngagement) => {
          setEngagementRequest(null)
          setActiveEngagement(newEngagement) // real engagement, with real copied tasks
        },
      }
    )
  }

  const handleBackToEngagement = () => { // cannot reedit
    setActiveEngagement(null)
  }

  const handleSendToClient = () => {
    setActiveEngagement(null)
    navigate(`${basePath}/engagements`)
  }

  usePageMeta({
    title: "Service Requests",
    breadcrumbs: [
      // { label: basePath === "/firm" ? "Firm Staff" : "Firm Admin", href: `${basePath}/dashboard` },
      // { label: "Service Requests", href: `${basePath}/service-requests` },
    ],
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        <p className="text-sm text-muted-foreground">
          Review incoming service requests submitted by clients and decide whether to start an
          engagement.
        </p>
        {error && <span className="text-xs text-destructive">Failed to load service requests</span>}
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
        loading={isLoading}
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
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
import {
  statusFilterOptions,
} from "@/components/firm/service-requests/service-request-variants"
import { authStore } from "@/store/authStore"
import { useFetchServiceRequests, useUpdateServiceRequestStatus } from "@/hooks/useServiceRequests"
import { useCreateEngagementFromRequest } from "@/hooks/useEngagements"
import { getCategoryLabel } from "@/lib/service-categories"

export default function ServiceRequestsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const basePath = location.pathname.startsWith("/firm") ? "/firm" : "/admin"
  const role = authStore((state) => state.role)
  const canRejectRequest = role === "admin"

  const { data: requests = [], isLoading, error } = useFetchServiceRequests()
  const updateStatus = useUpdateServiceRequestStatus()
  const createEngagement = useCreateEngagementFromRequest()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)

  // Approve -> Create Engagement flow. Nothing is saved until the "confirm" step.
  const [engagementRequest, setEngagementRequest] = useState(null)
  const [engagementDraft, setEngagementDraft] = useState(null)
  const [step, setStep] = useState(null) // null | "form" | "confirm"

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
        [request.business?.businessName, request.requestNumber, getCategoryLabel(request?.category)].some((field) =>
          field?.toLowerCase().includes(query)
        )
      return matchesStatus && matchesSearch
    })
  }, [requests, search, statusFilter])

  const openRequest = (request) => {
    updateStatus.reset()
    setSelectedId(request.id)
  }
  const closeRequest = () => setSelectedId(null)

  const resetFlow = () => {
    createEngagement.reset()
    setStep(null)
    setEngagementRequest(null)
    setEngagementDraft(null)
  }

  const handleApproveAndEngage = (request) => {
    if (!request) return
    closeRequest()
    createEngagement.reset()
    setEngagementRequest(request)
    setEngagementDraft(null)
    setStep("form")
  }

  const handleReject = (request, reason, onSuccess) => {
    if (!request) return
    updateStatus.mutate(
      { id: request.id, status: "rejected", rejectionReason: reason },
      {
        onSuccess: () => {
          onSuccess?.()
          closeRequest()
        },
      }
    )
  }

  // Step 1 -> 2: form is valid, show the confirmation. No API call yet.
  const handleFormSubmit = (values) => {
    setEngagementDraft(values)
    setStep("confirm")
  }

  // Step 2 -> 1: the form stays mounted, so its values are preserved.
  const handleBackToForm = () => {
    createEngagement.reset()
    setStep("form")
  }

  // Step 2: the only place the engagement (and request approval) is actually saved.
  const handleConfirmEngagement = () => {
    if (!engagementRequest || !engagementDraft || createEngagement.isPending) return

    createEngagement.mutate(
      {
        serviceRequestId: engagementRequest.id,
        serviceId: engagementDraft.serviceId,
        assignedStaff: engagementDraft.assignedStaff,
        startDate: engagementDraft.startDate,
        dueDate: engagementDraft.targetEndDate,
        fee: engagementDraft.serviceFee,
      },
      {
        onSuccess: () => {
          resetFlow()
          navigate(`${basePath}/engagements`)
        },
      }
    )
  }

  usePageMeta({
    title: "Service Requests",
    breadcrumbs: [],
  })

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 py-1">
        {error && <span className="text-xs text-destructive">Failed to load service requests</span>}
      </div>

      <ServiceRequestFilters
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value)
          setCurrentPage(1)
        }}
        searchPlaceholder="Search by client, request no., or category..."
        statusFilter={statusFilter}
        onStatusFilterChange={(value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        }}
        statusOptions={statusOptions}
        resultCount={`${filteredRequests.length} of ${requests.length} requests`}
      />

      <ServiceRequestList
        requests={filteredRequests}
        loading={isLoading}
        emptyMessage="No service requests match your filters."
        onRowClick={(request) => openRequest(request)}
        page={currentPage}
        onPageChange={setCurrentPage}
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
        canReject={canRejectRequest}
        rejecting={updateStatus.isPending}
        rejectionError={
          updateStatus.isError
            ? updateStatus.error?.message || "Unable to reject the request. Please try again."
            : ""
        }
      />

      {/* key resets the form's internal state for each request; it stays mounted
          while moving between "form" and "confirm" so Back keeps the values. */}
      <CreateEngagementDialog
        key={engagementRequest?.id ?? "none"}
        open={step === "form"}
        onOpenChange={(open) => {
          if (!open) resetFlow()
        }}
        request={engagementRequest}
        onSubmit={handleFormSubmit}
      />

      <RequiredDocumentsDialog
        open={step === "confirm"}
        onOpenChange={(open) => {
          if (!open && !createEngagement.isPending) resetFlow()
        }}
        request={engagementRequest}
        draft={engagementDraft}
        submitting={createEngagement.isPending}
        error={
          createEngagement.isError
            ? createEngagement.error?.message || "Unable to create the engagement. Please try again."
            : ""
        }
        onBack={handleBackToForm}
        onConfirm={handleConfirmEngagement}
      />
    </>
  )
}
import { useCallback, useState } from "react"
import { X } from "lucide-react"

import { DashboardLayout } from "@/layout/DashboardLayout"
import { NewServiceRequestForm } from "@/components/firm/service-requests/NewServiceRequestForm"
import { Button } from "@/components/ui/button"
import { ClientNotifications } from "@/components/client/ClientNotifications"
import { authStore } from "@/store/authStore"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"
import { useFetchMyServiceRequests } from "@/hooks/useServiceRequests"

export function ClientLayout() {
  const user = authStore((state) => state.user)
  const {
    data: business,
    isLoading: isBusinessLoading,
    error: businessError,
    refetch: refetchBusiness,
  } = useFetchMyBusiness(user?.id)
  const businessId = business?.id
  const {
    data: requests = [],
    isLoading: areRequestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useFetchMyServiceRequests(businessId)
  const isNonRetainer = business?.clientType !== "retainer"

  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const openNewRequest = useCallback(() => setIsNewRequestOpen(true), [])
  const closeNewRequest = useCallback(() => setIsNewRequestOpen(false), [])

  return (
    <>
      {/* The header's "Request Service" button opens the popup on any client page */}
      <DashboardLayout
        role="client"
        onRequestServiceClick={openNewRequest}
        notificationsContent={<ClientNotifications />}
      />

      {isNewRequestOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeNewRequest}
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
                onClick={closeNewRequest}
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {isBusinessLoading ? (
              <p className="py-6 text-sm text-muted-foreground">Checking request eligibility...</p>
            ) : businessError ? (
              <div className="space-y-3 py-2">
                <p className="text-sm text-red-700">
                  We couldn't verify your business details. Please try again before submitting a request.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => refetchBusiness()}>
                  Try again
                </Button>
              </div>
            ) : !businessId ? (
              <p className="py-2 text-sm text-red-700">
                No business found for your account. Please contact support.
              </p>
            ) : isNonRetainer && areRequestsLoading ? (
              <p className="py-6 text-sm text-muted-foreground">Checking request eligibility...</p>
            ) : isNonRetainer && requestsError ? (
              <div className="space-y-3 py-2">
                <p className="text-sm text-red-700">
                  We couldn't check your existing service requests. Please try again before submitting a request.
                </p>
                <Button type="button" variant="outline" size="sm" onClick={() => refetchRequests()}>
                  Try again
                </Button>
              </div>
            ) : (
              <NewServiceRequestForm
                businessId={businessId}
                clientType={business.clientType}
                hasExistingServiceRequest={requests.length > 0}
                onSubmitted={closeNewRequest}
                onCancel={closeNewRequest}
              />
            )}
          </div>
        </div>
      )}
    </>
  )
}
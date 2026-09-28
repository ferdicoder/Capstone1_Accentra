import { useCallback, useState } from "react"
import { X } from "lucide-react"

import { DashboardLayout } from "@/layout/DashboardLayout"
import { NewServiceRequestForm } from "@/components/firm/service-requests/NewServiceRequestForm"
import { authStore } from "@/store/authStore"
import { useFetchMyBusiness } from "@/hooks/useBusinesses"

export function ClientLayout() {
  const user = authStore((state) => state.user)
  const { data: business } = useFetchMyBusiness(user?.id)
  const businessId = business?.id

  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)
  const openNewRequest = useCallback(() => setIsNewRequestOpen(true), [])
  const closeNewRequest = useCallback(() => setIsNewRequestOpen(false), [])

  return (
    <>
      {/* The header's "Request Service" button opens the popup on any client page */}
      <DashboardLayout role="client" onRequestServiceClick={openNewRequest} />

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

            <NewServiceRequestForm
              businessId={businessId}
              onSubmitted={closeNewRequest}
              onCancel={closeNewRequest}
            />
          </div>
        </div>
      )}
    </>
  )
}
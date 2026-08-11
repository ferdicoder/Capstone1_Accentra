import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClientInfoCard } from "./client-info-card"
import { RequestActionButtons, RequestActionNotice } from "./request-action-buttons"
import { RequestDetailsCard } from "./request-details-card"
import { ServiceRequestAvatar } from "./service-request-avatar"
import { formatSubmittedDate } from "./service-request-variants"

/**
 * Modal that shows a single service request for review. The parent owns
 * `open`/`onOpenChange` and the data work (`onApprove`/`onReject`); the dialog
 * owns its transient UI state (internal notes + simulated processing), which
 * resets on every open.
 */
export function RequestDetailDialog({ open = false, onOpenChange, request, onApprove, onReject }) {
  const [processing, setProcessing] = useState(null) // null | "approve" | "reject"

  const handleAction = (action) => {
    setProcessing(action)
    // Simulated request — swap for a real API call later.
    window.setTimeout(() => {
      if (action === "approve") onApprove?.(request)
      if (action === "reject") onReject?.(request)
      setProcessing(null)
    }, 600)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="request-detail-dialog" className="max-w-3xl">
        <DialogHeader className="flex-col items-start gap-3 border-b pb-4 pr-10 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <ServiceRequestAvatar name={request?.business?.businessName} className="shrink-0" />
            <div className="min-w-0">
              <DialogTitle className="truncate text-lg">{request?.business?.businessName}</DialogTitle>
              <DialogDescription className="truncate">
                {request?.requestNumber} · {request?.serviceName} · submitted{" "}
                {formatSubmittedDate(request?.submittedDate)}
              </DialogDescription>
            </div>
          </div>

          <RequestActionButtons
            status={request?.status}
            processing={processing}
            onApprove={() => handleAction("approve")}
            onReject={() => handleAction("reject")}
            className="shrink-0"
          />
        </DialogHeader>

        <RequestActionNotice status={request?.status} />

        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-5">
            <RequestDetailsCard request={request} />
            <ClientInfoCard request={request} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

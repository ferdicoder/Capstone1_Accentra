import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ClientInfoCard } from "./client-info-card"
import { RequestActionCard } from "./request-action-card"
import { RequestDetailsCard } from "./request-details-card"
import { RequestInternalNotes } from "./request-internal-notes"
import { formatSubmittedDate } from "./service-request-variants"

/**
 * Modal that shows a single service request for review. The parent owns
 * `open`/`onOpenChange` and the data work (`onApprove`/`onReject`); the dialog
 * owns its transient UI state (internal notes + simulated processing), which
 * resets on every open.
 */
export function RequestDetailDialog({
  open = false,
  onOpenChange,
  request,
  onApprove,
  onReject,
  className,
  ...props
}) {
  const [notes, setNotes] = useState("")
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

  const handleSaveNotes = () => {
    // Frontend state only — persist through a real API later.
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent data-slot="request-detail-dialog" className={className}>
        <DialogHeader className="pr-8">
          <DialogTitle>
            {request?.requestNumber} · {request?.companyName}
          </DialogTitle>
          <DialogDescription>
            {request?.serviceName} · submitted by {request?.contactPerson} on{" "}
            {formatSubmittedDate(request?.submittedDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="flex flex-col gap-5">
              <RequestDetailsCard request={request} />
              <RequestInternalNotes
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                onSave={handleSaveNotes}
              />
            </div>

            <div className="flex flex-col gap-5">
              <RequestActionCard
                status={request?.status}
                processing={processing}
                onApprove={() => handleAction("approve")}
                onReject={() => handleAction("reject")}
              />
              <ClientInfoCard request={request} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { EngagementStatusBadge } from "./engagement-status-badge"
import { getClientFullName, formatDate, getServiceCategoryLabel, firmStaffMap } from "./engagement-variants"

function InfoField({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

export function ClientServiceDetailsDialog({ open, onOpenChange, engagement }) {
  if (!engagement) return null

  const staffLabel = firmStaffMap[engagement.assignedStaff] ?? "—"
  const serviceCategory = getServiceCategoryLabel(engagement.serviceName)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="client-service-details-dialog" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Client & Service Details</DialogTitle>
          <DialogDescription>
            Full information for engagement {engagement.engagementNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 overflow-y-auto max-h-[70vh] p-1">
          {/* Two-column layout */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Client Information */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Client Information</h3>
              <InfoField label="Client Name">{getClientFullName(engagement.client)}</InfoField>
              <InfoField label="Email">{engagement.client?.email ?? "—"}</InfoField>
              <InfoField label="Contact Number">{engagement.client?.contactNo ?? "—"}</InfoField>
              <InfoField label="Business Name">{engagement.business?.businessName ?? "—"}</InfoField>
              <InfoField label="Business Type">{engagement.business?.businessType ?? "—"}</InfoField>
              <InfoField label="TIN">{engagement.business?.tinNo ?? "—"}</InfoField>
              <InfoField label="Business Address">{engagement.business?.address ?? "—"}</InfoField>
            </div>

            {/* Right Column: Service Information */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">Service Information</h3>
              <InfoField label="Service Name">{engagement.serviceName}</InfoField>
              <InfoField label="Service Category">{serviceCategory}</InfoField>
              <InfoField label="Assigned Staff">{staffLabel}</InfoField>
              <InfoField label="Start Date">{formatDate(engagement.startDate)}</InfoField>
              <InfoField label="Target Deadline">
                <span className="text-red-600">{formatDate(engagement.targetEndDate)}</span>
              </InfoField>
              <InfoField label="Engagement Status">
                <EngagementStatusBadge status={engagement.status} />
              </InfoField>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

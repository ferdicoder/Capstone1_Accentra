import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { EngagementDetailsContent } from "@/components/shared/EngagementDetailsContent"
import { getClientFullName, formatDate, getServiceCategoryLabel, firmStaffMap } from "./engagement-variants"

export function ClientServiceDetailsDialog({ open, onOpenChange, engagement }) {
  if (!engagement) return null

  const staffLabel = firmStaffMap[engagement.assignedStaff] ?? "—"
  const serviceCategory = getServiceCategoryLabel(engagement.serviceName)

  const clientInfo = {
    fields: [
      { label: "Full Name", value: getClientFullName(engagement.client), fullWidth: true },
      { label: "Email", value: engagement.client?.email ?? "—" },
      { label: "Contact Number", value: engagement.client?.contactNo ?? "—" },
      { label: "Business Name", value: engagement.business?.businessName ?? "—" },
      { label: "Business Type", value: engagement.business?.businessType ?? "—" },
      { label: "TIN", value: engagement.business?.tinNo ?? "—" },
      { label: "Industry", value: engagement.business?.industry ?? "—" },
      { label: "Business Address", value: engagement.business?.address ?? "—", fullWidth: true },
    ],
  }

  const serviceInfo = {
    description: "Details about the selected service",
    fields: [
      { label: "Service Category", value: serviceCategory },
      { label: "Assigned Staff", value: staffLabel },
      { label: "Start Date", value: formatDate(engagement.startDate) },
    ],
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-slot="client-service-details-dialog" className="max-w-6xl">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle>Client & Service Details</DialogTitle>
          <DialogDescription>
            Full information for engagement {engagement.engagementNumber}
          </DialogDescription>
        </DialogHeader>

        <EngagementDetailsContent
          engagement={engagement}
          clientInfo={clientInfo}
          serviceInfo={serviceInfo}
        />
      </DialogContent>
    </Dialog>
  )
}

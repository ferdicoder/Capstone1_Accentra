import { cn } from "@/lib/utils"
import { getClientFullName, formatDate, getServiceCategoryLabel, firmStaffMap } from "./engagement-variants"
import { EngagementStatusBadge } from "./engagement-status-badge"

function InfoField({ label, children, className }) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium text-foreground">{children}</dd>
    </div>
  )
}

export function ClientServiceInfoCard({ engagement, onViewAll, className }) {
  if (!engagement) return null

  const staffLabel = firmStaffMap[engagement.assignedStaff] ?? "—"
  const serviceCategory = getServiceCategoryLabel(engagement.serviceName)

  return (
    <div className={cn("rounded-xl border border-border bg-card p-6 shadow-sm", className)}>
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

      {/* View all → shortcut at lower-right */}
      {onViewAll && (
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            View all →
          </button>
        </div>
      )}
    </div>
  )
}

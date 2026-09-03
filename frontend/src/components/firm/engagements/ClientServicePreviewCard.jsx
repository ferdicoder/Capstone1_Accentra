import { cn } from "@/lib/utils"
import { getClientFullName, firmStaffMap } from "./engagement-variants"

export function ClientServicePreviewCard({ engagement, className }) {
  if (!engagement) return null

  const clientName = getClientFullName(engagement.client)
  const staffLabel = firmStaffMap[engagement.assignedStaff] ?? "—"

  return (
    <div className={cn("rounded-xl border border-border bg-card p-5 shadow-sm", className)}>
      <div className="flex items-center gap-6 min-w-0">
        {/* Client */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">Client</span>
          <span className="text-sm font-semibold text-foreground truncate">{clientName}</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-border" />

        {/* Service */}
        <div className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">Service</span>
          <span className="text-sm font-semibold text-foreground truncate">{engagement.serviceName}</span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block h-8 w-px bg-border" />

        {/* Staff */}
        <div className="hidden md:flex flex-col gap-1 min-w-0">
          <span className="text-xs font-medium text-muted-foreground">Assigned Staff</span>
          <span className="text-sm font-semibold text-foreground truncate">{staffLabel}</span>
        </div>
      </div>
    </div>
  )
}

import { DashboardLayout } from "@/layout/DashboardLayout"

export default function FirmStaffDashboard() {
  return (
    <DashboardLayout
      role="firm-staff"
      title="Dashboard"
      breadcrumbs={[{ label: "Firm Staff", href: "/firm-staff/dashboard" }]}
    >
      {/* Page content goes here */}
    </DashboardLayout>
  )
}

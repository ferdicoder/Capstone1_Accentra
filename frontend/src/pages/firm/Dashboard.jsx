import { DashboardLayout } from "@/layout/DashboardLayout"

export default function FirmAdminDashboard() {
  return (
    <DashboardLayout
      role="firm-admin"
      title="Dashboard"
      breadcrumbs={[{ label: "Firm Admin", href: "/firm-admin/dashboard" }]}
    >
      {/* Page content goes here */}
    </DashboardLayout>
  )
}

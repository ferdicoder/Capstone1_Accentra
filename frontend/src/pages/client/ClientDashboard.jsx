import { DashboardLayout } from "@/layout/DashboardLayout"

export default function ClientDashboard() {
  return (
    <DashboardLayout
      role="client"
      title="Dashboard"
      breadcrumbs={[{ label: "Client Portal", href: "/client/dashboard" }]}
    >
      {/* Page content goes here */}
    </DashboardLayout>
  )
}

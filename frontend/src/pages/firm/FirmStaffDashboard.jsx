import { useEffect, useState } from "react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { DashboardLayout } from "@/layout/DashboardLayout"

export default function FirmStaffDashboard() {
  const [loading, setLoading] = useState(true)

  // Simulated load so the shared skeleton system has something to show.
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <DashboardLayout
      role="firm-staff"
      title="Dashboard"
      breadcrumbs={[{ label: "Firm Staff", href: "/firm-staff/dashboard" }]}
    >
      {loading ? <PageSkeleton type="dashboard" /> : null}
    </DashboardLayout>
  )
}

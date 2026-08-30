import { useEffect, useState } from "react"

import { PageSkeleton } from "@/components/shared/loading/page-skeleton"
import { usePageMeta } from "@/hooks/usePageMeta"

export default function FirmStaffDashboard() {
  const [loading, setLoading] = useState(true)

  usePageMeta({
    title: "Dashboard",
    breadcrumbs: [{ label: "Firm Staff", href: "/firm/dashboard" }],
  })

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  return loading ? <PageSkeleton type="dashboard" /> : null
}

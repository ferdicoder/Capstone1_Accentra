import { DashboardLayout } from "@/layout/DashboardLayout"
import { ClientNotifications } from "@/components/client/ClientNotifications"

export function BillingOfficerLayout() {
  return (
    <DashboardLayout
      notificationsContent={<ClientNotifications role="billing_officer" />}
    />
  )
}
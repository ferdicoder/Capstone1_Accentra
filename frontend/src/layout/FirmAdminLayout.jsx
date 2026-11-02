import { DashboardLayout } from "@/layout/DashboardLayout"
import { ClientNotifications } from "@/components/client/ClientNotifications"

export function FirmAdminLayout() {
  return <DashboardLayout notificationsContent={<ClientNotifications role="admin" />} />
}

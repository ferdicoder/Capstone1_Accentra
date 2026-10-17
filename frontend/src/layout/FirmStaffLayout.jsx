import { DashboardLayout } from "@/layout/DashboardLayout"
import { ClientNotifications } from "@/components/client/ClientNotifications"

export function FirmStaffLayout() {
  return <DashboardLayout notificationsContent={<ClientNotifications role="staff" />} />
}

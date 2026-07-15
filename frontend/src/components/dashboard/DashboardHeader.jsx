import { Bell } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function DashboardHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-4">

      <SidebarTrigger />

      <div className="flex items-center gap-3">

        <Bell className="size-5" />

        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-800 text-xs text-white">
          MS
        </div>

      </div>

    </header>
  )
}
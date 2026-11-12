import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { LogoutConfirmDialog } from "@/components/dashboard/logout-confirm-dialog"
import { supabase } from "@/config/supabase"
import { authStore } from "@/store/authStore"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavUser({ user, subtitle }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [logoutOpen, setLogoutOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const role = authStore((state) => state.role)
  // Clients sign in on their own page; admin, staff and billing officers use the firm page.
  const signInPath = role === "client" ? "/client/signin" : "/firm/signin"

  const confirmLogout = async () => {
    if (loggingOut) return // prevents duplicate logout requests
    setLoggingOut(true)

    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      queryClient.clear()
      setLogoutOpen(false)
      navigate(signInPath, { replace: true })
    } catch (error) {
      console.error("Logout failed:", error)
      setLoggingOut(false)
    }
  }

  if (!user) return null

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
            <Avatar className="h-8 w-8 shrink-0 rounded-lg group-data-[collapsible=icon]:hidden">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="rounded-lg">
                {user.name?.slice(0, 2)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">{user.name}</span>
              {subtitle && (
                <span className="truncate text-xs text-white/60">{subtitle}</span>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Log out"
              title="Log out"
              onClick={() => setLogoutOpen(true)}
              className="shrink-0 text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </Button>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Keep the confirmation dialog mounted independently of its trigger. */}
      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={confirmLogout}
        submitting={loggingOut}
      />
    </>
  )
}
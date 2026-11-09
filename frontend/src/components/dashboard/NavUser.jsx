import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import {
  ChevronsUpDown,
  LogOut,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { LogoutConfirmDialog } from "@/components/dashboard/logout-confirm-dialog"
import { supabase } from "@/config/supabase"
import { authStore } from "@/store/authStore"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({ user }) {
  const { isMobile } = useSidebar()
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
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className=" data-[state=open]:bg-sidebar-accent 
                              data-[state=open]:text-sidebar-accent-foreground
                              group-data-[collapsible=icon]:size-8!
                              group-data-[collapsible=icon]:p-0!
                              group-data-[collapsible=icon]:justify-center"
                />
              }
            >
              <Avatar className="h-8 w-8 shrink-0 rounded-lg">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name?.slice(0, 2)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* BUG fix: footer trigger no longer shows the email — name only. */}
              <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                <span className="truncate font-semibold">{user.name}</span>
              </div>

              <ChevronsUpDown className="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuItem onClick={() => setLogoutOpen(true)}>
                <LogOut />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* Sibling of the dropdown, so it stays mounted after the menu closes. */}
      <LogoutConfirmDialog
        open={logoutOpen}
        onOpenChange={setLogoutOpen}
        onConfirm={confirmLogout}
        submitting={loggingOut}
      />
    </>
  )
}
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { authStore } from "@/store/authStore"
import { getHome } from "@/config/roles"

export function PublicOnlyRoutes() {
  const { user, role, loading } = authStore()
  const location = useLocation()
  if (loading) return null

  const isWrongPortalSession =
    (location.pathname === "/client/signin" && role !== "client") ||
    (location.pathname === "/firm/signin" && role === "client")

  if (isWrongPortalSession) return <Outlet />

  const home = getHome(role)
  return user && home ? <Navigate to={home} replace /> : <Outlet />
}
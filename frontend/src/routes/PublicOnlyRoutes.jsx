import { Navigate, Outlet } from "react-router-dom"
import { authStore } from "@/store/authStore"
import { getHome } from "@/config/roles"

export function PublicOnlyRoutes() {
  const { user, role, loading } = authStore()
  if (loading) return null
  const home = getHome(role)
  return user && home ? <Navigate to={home} replace /> : <Outlet />
}
import { Navigate, Outlet } from "react-router-dom"
import { authStore } from "@/store/authStore"
import { roles, signinPath, getHome } from "@/config/roles"

export function ProtectedRoutes({ allow }) {
  const { user, role, loading } = authStore()

  if (loading) return null

  if (!user) return <Navigate to={signinPath[roles[allow[0]].portal]} replace />

  if (!allow.includes(role)) return <Navigate to={getHome(role) ?? signinPath.firm} replace />

  return <Outlet />
}
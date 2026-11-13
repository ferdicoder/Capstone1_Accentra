import { Navigate, Outlet } from "react-router-dom"
import { authStore } from "@/store/authStore"
import { roles, signinPath, getHome } from "@/config/roles"

const FIRM_ROLES = ["admin", "staff", "billing_officer"]

export function ProtectedRoutes({ allow, allowInactive = false }) {
  const { user, role, status, loading } = authStore()

  if (loading) return null

  if (!user) return <Navigate to={signinPath[roles[allow[0]].portal]} replace />

  if (!allow.includes(role)) return <Navigate to={getHome(role) ?? signinPath.firm} replace />

  // Firm user still on the Admin-issued temporary password.
  if (status === "inactive" && FIRM_ROLES.includes(role) && !allowInactive) {
    return <Navigate to="/set-password" replace />
  }

  return <Outlet />
}
import { Navigate, Outlet } from "react-router-dom"

import { authStore } from "@/store/authStore"

// Route groups map to the actual roles stored in the database.
const routeRoleAccess = {
  client: ["client"],
  "firm-admin": ["admin"],
  "firm-staff": ["staff", "billing_officer"],
}

const roleHome = {
  client: "/client/dashboard",
  "firm-admin": "/admin/dashboard",
  "firm-staff": "/firm/dashboard",
}

function getCanonicalRole(role) {
  return Object.entries(routeRoleAccess).find(([, roles]) => roles.includes(role))?.[0]
}

export function ProtectedRoute({ role }) {
  const { user, role: currentRole, loading } = authStore()

  if (loading) return null

  if (!user) {
    return <Navigate to={role === "client" ? "/client/signin" : "/firm/signin"} replace />
  }

  if (!routeRoleAccess[role]?.includes(currentRole)) {
    const canonicalRole = getCanonicalRole(currentRole)
    return <Navigate to={roleHome[canonicalRole] ?? "/firm/signin"} replace />
  }

  return <Outlet />
}
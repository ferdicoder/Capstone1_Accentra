import { Navigate, Outlet } from "react-router-dom"

import { authStore } from "@/store/authStore"

const roleAliases = {
  client: ["client"],
  "firm-admin": ["firm-admin", "admin"],
  "firm-staff": ["firm-staff", "staff"],
}

const roleHome = {
  client: "/client/dashboard",
  "firm-admin": "/admin/dashboard",
  "firm-staff": "/firm/dashboard",
}

function getCanonicalRole(role) {
  return Object.entries(roleAliases).find(([, aliases]) => aliases.includes(role))?.[0]
}

export function ProtectedRoute({ role }) {
  const { user, role: currentRole, loading } = authStore()

  if (loading) return null

  if (!user) {
    return <Navigate to={role === "client" ? "/client/signin" : "/firm/signin"} replace />
  }

  if (!roleAliases[role]?.includes(currentRole)) {
    const canonicalRole = getCanonicalRole(currentRole)
    return <Navigate to={roleHome[canonicalRole] ?? "/firm/signin"} replace />
  }

  return <Outlet />
}
import { createBrowserRouter, Navigate } from "react-router-dom";
import ClientDashboard  from '@/pages/client/ClientDashboard'; 
import LoginPage from "@/pages/client/LoginPage";

import FirmAdminDashboard from "@/pages/firm/FirmAdminDashboard";


function ProtectedRoute({ allowedRoles, children }) {
  const { role, loading } = useAuthStore();
  // if (loading) return <Spinner /> ala pa loading spinner
  if (!role) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />
  },
  {
    path: '/client/dashboard',
    element: <ClientDashboard />
  },
  {
    path: '/admin/dashboard',
    element: <FirmAdminDashboard />
  }
]); 
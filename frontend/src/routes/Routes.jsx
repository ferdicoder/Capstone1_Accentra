import { createBrowserRouter, Navigate } from "react-router-dom";

import ClientDashboard  from '@/pages/client/ClientDashboard'; 
import LoginPage from "@/pages/client/LoginPage";
import SignupPage from "@/pages/client/SignupPage";

import FirmAdminDashboard from "@/pages/firm/FirmAdminDashboard";
import FirmLoginPage from "@/pages/firm/FirmLoginPage";
import FirmStaffDashboard from "@/pages/firm/FirmStaffDashboard";


function ProtectedRoute({ allowedRoles, children }) {
  const { role, loading } = useAuthStore();
  // if (loading) return <Spinner /> ala pa loading spinner
  if (!role) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/unauthorized" replace />;
  return children;
}

export const router = createBrowserRouter([
  {
    path: '/client/signup',
    element: <SignupPage />
  },
  {
    path: '/client/signin',
    element: <LoginPage />
  },
  {
    path: '/client/dashboard',
    element: <ClientDashboard />
  },
  {
    path: '/firm/signin',
    element: <FirmLoginPage />
  },
  {
    path: '/firm/dashboard',
    element: <FirmStaffDashboard />
  },
  {
    path: '/admin/dashboard',
    element: <FirmAdminDashboard />
  }
]); 
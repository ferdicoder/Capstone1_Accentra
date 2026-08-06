import { createBrowserRouter } from "react-router-dom";

import ClientDashboard  from '@/pages/client/ClientDashboard'; 
import LoginPage from "@/pages/client/LoginPage";
import SignupPage from "@/pages/client/SignupPage";

import FirmAdminDashboard from "@/pages/firm/FirmAdminDashboard";
import FirmLoginPage from "@/pages/firm/FirmLoginPage";
import FirmStaffDashboard from "@/pages/firm/FirmStaffDashboard";
import UserManagementPage from "@/pages/firm/UserManagementPage";
import ServiceManagementPage from "@/pages/firm/ServiceManagementPage";

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
  },
  {
    path: '/admin/users',
    element: <UserManagementPage />
  },
  {
    path: '/admin/services',
    element: <ServiceManagementPage />
  }
]); 
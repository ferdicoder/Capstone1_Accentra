import { createBrowserRouter } from "react-router-dom";

import ClientDashboard  from '@/pages/client/ClientDashboard'; 
import LoginPage from "@/pages/client/LoginPage";
import SignupPage from "@/pages/client/SignupPage";

import FirmAdminDashboard from "@/pages/firm/FirmAdminDashboard";
import FirmLoginPage from "@/pages/firm/FirmLoginPage";
import FirmStaffDashboard from "@/pages/firm/FirmStaffDashboard";
// TEMPORARY preview route ni lexi
import FirmUserListPreview from "@/pages/firm/FirmUserListPreview";

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
    // TEMPORARY preview route ni lexi
    path: '/firm-users-preview',
    element: <FirmUserListPreview />
  }
]); 
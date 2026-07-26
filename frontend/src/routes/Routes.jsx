import { createBrowserRouter } from "react-router-dom";
import  ClientDashboard  from '@/pages/client/ClientDashboard'; 
import FirmAdminDashboard from "@/pages/firm/FirmAdminDashboard";

export const router = createBrowserRouter([
  {
    path: '/client/dashboard',
    element: <ClientDashboard />
  }, 
  {
    path: '/admin/dashboard',
    element: <FirmAdminDashboard />
  }
])
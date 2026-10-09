import { createBrowserRouter, Navigate } from "react-router-dom";

import { ClientLayout } from "@/layout/ClientLayout";
import { FirmAdminLayout } from "@/layout/FirmAdminLayout";
import { FirmStaffLayout } from "@/layout/FirmStaffLayout";
import {BillingOfficerLayout} from "@/layout/BillingOfficerLayout";
import { ProtectedRoutes } from "@/routes/ProtectedRoutes";
import { PublicOnlyRoutes } from "./PublicOnlyRoutes";

import ClientDashboard from "@/pages/client/ClientDashboard";
import LoginPage from "@/pages/client/LoginPage";
import SignupPage from "@/pages/client/SignupPage";
import ClientProfilePage from "@/pages/client/ClientProfilePage";
import ClientServiceRequestsPage from "@/pages/client/ClientServiceRequestsPage";
import ClientEngagementsPage from "@/pages/client/ClientEngagementsPage";
import ClientEngagementDetailPage from "@/pages/client/ClientEngagementDetailPage";
import ClientBillingPage from "@/pages/client/ClientBillingPage";

import FirmAdminDashboard from "@/pages/firm/FirmAdminDashboard";
import FirmLoginPage from "@/pages/firm/FirmLoginPage";
import FirmStaffDashboard from "@/pages/firm/FirmStaffDashboard";
import UserManagementPage from "@/pages/firm/UserManagementPage";
import FirmProfilePage from "@/pages/firm/FirmProfilePage";
import ServiceManagementPage from "@/pages/firm/ServiceManagementPage";
import ServiceRequestsPage from "@/pages/firm/ServiceRequestsPage";
import EngagementsPage from "@/pages/firm/EngagementsPage";
import EngagementDetailsPage from "@/pages/firm/EngagementDetailsPage";
import ClientManagementPage from "@/pages/firm/ClientManagementPage";
import ClientDetailPage from "@/pages/firm/ClientDetailPage";
import BillingPage from "@/pages/firm/BillingPage";
import BillingDetailPage from "@/pages/firm/BillingDetailPage";
import LandingPage from "@/pages/LandingPage";
import ClientBillingDetailPage from "@/pages/client/ClientBillingDetailsPage";


import BillingOfficerDashboard from "@/pages/firm/BillingOfficerDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/client/signup",
    element: <SignupPage />,
  },
  {
    element: <PublicOnlyRoutes />,
    children: [
      { path: "/client/signin", element: <LoginPage /> },
      { path: "/firm/signin", element: <FirmLoginPage /> },
    ],
  },
  { 
    path: "/client",
    element: <ProtectedRoutes allow={["client"]} />,
    children: [
      {
        element: <ClientLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <ClientDashboard /> },
          { path: "profile", element: <ClientProfilePage /> },
          { path: "service-requests", element: <ClientServiceRequestsPage /> },
          { path: "engagements", element: <ClientEngagementsPage /> },
          { path: "engagements/:id", element: <ClientEngagementDetailPage /> },
          { path: "billing", element: <ClientBillingPage /> },
          { path: "billing/:id", element: <ClientBillingDetailPage /> }
        ],
      },
    ],
  },
  {
    path: "/admin",
    element: <ProtectedRoutes allow={["admin"]} />,
    children: [
      {
        element: <FirmAdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <FirmAdminDashboard /> },
          { path: "users", element: <UserManagementPage /> },
          { path: "profile", element: <FirmProfilePage /> },
          { path: "services", element: <ServiceManagementPage /> },
          { path: "service-requests", element: <ServiceRequestsPage /> },
          { path: "engagements", element: <EngagementsPage /> },
          { path: "engagements/:id", element: <EngagementDetailsPage /> },
          { path: "clients", element: <ClientManagementPage /> },
          { path: "clients/:id", element: <ClientDetailPage /> },
          { path: "billing", element: <BillingPage /> },
          { path: "billing/:id", element: <BillingDetailPage /> },
        ],
      },
    ],
  },
  {
    path: "/firm",
    element: <ProtectedRoutes allow={["staff"]} />,
    children: [
      {
        element: <FirmStaffLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <FirmStaffDashboard /> },
          { path: "service-requests", element: <ServiceRequestsPage /> },
          { path: "services", element: <ServiceManagementPage /> },
          { path: "engagements", element: <EngagementsPage /> },
          { path: "engagements/:id", element: <EngagementDetailsPage /> },
          { path: "clients", element: <ClientManagementPage /> },
          { path: "clients/:id", element: <ClientDetailPage /> },
        ],
      },
    ],
  },
  {
    path: "/firm-admin/engagements",
    element: <Navigate to="/admin/engagements" replace />,
  },
  {
    path: "/firm-admin/dashboard",
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: "/firm-staff/dashboard",
    element: <Navigate to="/firm/dashboard" replace />,
  },
  {
    path: "/billing-officer",
    element: <ProtectedRoutes allow={["billing_officer"]} />,
    children: [
      {
        element: <BillingOfficerLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <BillingOfficerDashboard /> },
          { path: "engagements", element: <EngagementsPage /> },
          { path: "engagements/:id", element: <EngagementDetailsPage /> },
          { path: "billing", element: <BillingPage /> },
          { path: "billing/:id", element: <BillingDetailPage /> },
        ],
      },
    ],
  },
]);
import { RouterProvider } from "react-router-dom";
import { router } from '@/routes/Routes'
import { useAuth } from "./hooks/useAuth";

export default function App() {
  useAuth();
  return (
    <RouterProvider router={router} />
  )
}
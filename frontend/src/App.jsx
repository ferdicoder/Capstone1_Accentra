import { RouterProvider } from "react-router-dom";
import { router } from '@/routes/Routes'

export default function App() {
  return (
    <RouterProvider router={router} />
  )
}
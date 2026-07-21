import { GalleryVerticalEnd } from "lucide-react"

import { LoginForm } from "@/components/client/login-form"
import { AuthLayout } from "@/layout/auth-layout"

export default function LoginPage() {
  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  )
}


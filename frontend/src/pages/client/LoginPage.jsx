import { ClientLoginForm } from "@/components/client/ClientLoginForm"
import { AuthLayout } from "@/layout/auth-layout"

export default function LoginPage() {
  return (
    <AuthLayout>
      <ClientLoginForm />
    </AuthLayout>
  )
}
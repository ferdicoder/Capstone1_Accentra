
import { useState } from "react"
import { LoginForm } from "@/components/shared/LoginForm"
import { FirmAuthLayout } from "@/layout/firm-auth-layout"
import { AdminForgotPasswordModal } from "@/components/firm/admin-forgot-password-modal"

export default function FirmLoginPage() {
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)

  return (
    <>
      <FirmAuthLayout>
        <LoginForm
          portal="firm"
          onForgotPassword={() => setIsForgotPasswordOpen(true)}
        />
      </FirmAuthLayout>

      {isForgotPasswordOpen && (
        <AdminForgotPasswordModal
          floating
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      )}
    </>
  )
}

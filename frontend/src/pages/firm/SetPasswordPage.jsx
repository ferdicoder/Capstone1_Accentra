import { useState } from "react"
import { Navigate, useNavigate } from "react-router-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { FirmAuthLayout } from "@/layout/firm-auth-layout"
import { authStore } from "@/store/authStore"
import { supabase } from "@/config/supabase"
import { getHome } from "@/config/roles"
import { useChangeOwnPassword } from "@/hooks/useUsers"
import { blockClipboard } from "@/lib/block-clipboard"

export default function SetPasswordPage() {
  const navigate = useNavigate()
  const { role, status, setStatus } = authStore()
  const changePassword = useChangeOwnPassword()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")

  // guard at the top: send finished users home, signed-out users to sign-in
  if (status && status !== "inactive") {
    return <Navigate to={getHome(role) ?? "/firm/signin"} replace />
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError("")

    if (newPassword.length < 8) return setError("Password must be at least 8 characters.")
    if (newPassword !== confirmPassword) return setError("Passwords do not match.")
    if (newPassword === currentPassword) {
      return setError("New password must be different from the temporary password.")
    }

    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setStatus("active")
          navigate(getHome(role), { replace: true })
        },
        onError: (err) => setError(err?.message || "Could not update password."),
      }
    )
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    authStore.getState().clearAuth()
    navigate("/firm/signin", { replace: true })
  }

  const submitting = changePassword.isPending

  return (
    <FirmAuthLayout>
      <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold">Set your new password</h1>
          <p className="text-sm text-muted-foreground">
            Your account was created with a temporary password. Choose your own to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="current-password">Temporary password</FieldLabel>
              <Input id="current-password" type="password" autoComplete="current-password"
                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={submitting} {...blockClipboard} />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-password">New password</FieldLabel>
              <Input id="new-password" type="password" autoComplete="new-password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting} {...blockClipboard} />
            </Field>
            <Field>
              <FieldLabel htmlFor="confirm-password">Confirm new password</FieldLabel>
              <Input id="confirm-password" type="password" autoComplete="new-password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting} {...blockClipboard} />
            </Field>
          </FieldGroup>

          {error && <p role="alert" className="text-sm text-red-500">{error}</p>}

          <Button type="submit" disabled={submitting}
            className="bg-forest-900 text-white hover:opacity-90">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            {submitting ? "Saving…" : "Save password"}
          </Button>

          <Button type="button" variant="ghost" onClick={handleSignOut} disabled={submitting}
            className="text-muted-foreground">
            Sign out
          </Button>
        </form>
      </div>
    </FirmAuthLayout>
  )
}
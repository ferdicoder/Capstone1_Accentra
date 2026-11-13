
import { useEffect, useState } from "react"
import { LoginForm } from "@/components/shared/LoginForm"
import { ForgotPasswordModal } from "@/components/client/ForgotPasswordModal"
import { ArrowLeft } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { LandingNav } from "@/components/landing/landing-nav"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  // Success notice handed over by the signup flow after email verification.
  // Captured once; the history state that carried it is cleared below.
  const [notice] = useState(() => location.state?.notice ?? "")

  const slideClass = location.state?.clientAuthSlide
    ? "client-auth-slide-up"
    : ""

  // Drop the handed-over notice from history so navigating back doesn't
  // replay it, but keep the slide flag so the entry animation isn't cut off.
  useEffect(() => {
    if (location.state?.notice) {
      navigate(location.pathname, {
        replace: true,
        state: { clientAuthSlide: true },
      })
    }
  }, [location.pathname, location.state, navigate])

  return (
    <>
      <LandingNav
        onSignIn={() =>
          navigate("/client/signin", {
            state: { clientAuthSlide: true },
          })
        }
        sectionPrefix="/"
      />

      <main className="min-h-svh pt-18">
        <div className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center gap-5 bg-linear-to-br from-[#e8f3ef] via-[#fbfcfa] to-[#dceee5] px-4 py-8 sm:gap-6">
          <header className="absolute left-4 top-4 z-10">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </button>
          </header>

          <div
            className={`client-auth-card w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-[0_20px_50px_rgba(15,71,62,0.14)] sm:p-8 ${slideClass}`}
          >
            {notice && (
              <p
                role="status"
                className="mb-4 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-500/20 ring-inset"
              >
                {notice}
              </p>
            )}
            <LoginForm
              portal="client"
              showSignup
              onForgotPassword={() => setIsForgotPasswordOpen(true)}
            />
          </div>
        </div>
      </main>

      {isForgotPasswordOpen && (
        <ForgotPasswordModal
          floating
          onClose={() => setIsForgotPasswordOpen(false)}
        />
      )}
    </>
  )
}

import { ArrowLeft } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { LandingNav } from "@/components/landing/landing-nav"

export function FirmAuthLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const slideClass = location.state?.clientAuthSlide
    ? "client-auth-slide-up"
    : ""

  return (
    <>
      <LandingNav
        onSignIn={() => navigate("/firm/signin", { state: { clientAuthSlide: true } })}
        sectionPrefix="/"
      />
      <main className="min-h-svh pt-[4.5rem]">
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
          <div className={`client-auth-card w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-[0_20px_50px_rgba(15,71,62,0.14)] sm:p-8 ${slideClass}`}>
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
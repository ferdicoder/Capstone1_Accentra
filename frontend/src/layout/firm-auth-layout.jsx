import { useLocation } from "react-router-dom"

import { LandingNav } from "@/components/landing/landing-nav"

export function FirmAuthLayout({ children }) {
  const location = useLocation()
  const slideClass = location.state?.clientAuthSlide
    ? "client-auth-slide-up"
    : ""

  return (
    <>
      <LandingNav sectionPrefix="/" />
      <main className="min-h-svh pt-[4.5rem]">
        <div className="relative flex min-h-[calc(100svh-4.5rem)] flex-col items-center justify-center gap-5 bg-linear-to-br from-[#e8f3ef] via-[#fbfcfa] to-[#dceee5] px-4 py-8 sm:gap-6">
          <div className={`client-auth-card w-full max-w-2xl rounded-xl border border-border bg-white p-5 shadow-[0_20px_50px_rgba(15,71,62,0.14)] sm:p-8 ${slideClass}`}>
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
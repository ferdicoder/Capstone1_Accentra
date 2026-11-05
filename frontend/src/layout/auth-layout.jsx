import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

import darkLogo from "@/assets/Logo1.svg"

export function AuthLayout({ children }) {
  const navigate = useNavigate()

  return (
    <div className="grid min-h-svh lg:grid-cols-2">

      {/* Left Side */}
      <div className="flex flex-col bg-linear-to-br from-navy-900 via-forest-900 to-emerald-500">
        {/* Branding sits in the top-left of the left panel, in normal flow using
            the panel's own m-8 spacing as the reference. Logo1.svg because this
            panel is dark; it sits directly on the panel with no background
            container, border or shadow. */}
        <div className="p-8">
          <a href="#" className="flex items-center gap-2 font-medium text-white">
            <img
              src={darkLogo}
              alt=""
              aria-hidden="true"
              className="h-6 w-auto shrink-0"
            />

            Accentra
          </a>
        </div>

        {/* Marketing content stays vertically centered in the space below the
            brand. Copy and horizontal centering are unchanged. */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-fit">
            <h1 className="m-8 text-5xl font-bold text-white">
              Accounting Made Simple
            </h1>

            <p className="m-8 text-lg text-white">
              Accentra bridges the gap between accounting firms and their clients.
              A centralized platform for managing your accounting services,
              client documents, and BIR compliance in one place.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex flex-col gap-4 p-6 md:p-10">

        {/* Back to the landing page. A real button so it is keyboard operable,
            and a fixed target so it always lands on "/" regardless of history. */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </button>

        {/* Form */}
        <div className="flex flex-1 items-center justify-center">
          <div className="w-lg rounded-xl border bg-white p-8 drop-shadow-2xl">
            
            {children}

          </div>
        </div>

      </div>

    </div>
  )
}
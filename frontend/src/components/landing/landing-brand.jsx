import { Link } from "react-router-dom"

import brandLogo from "@/assets/Favicon.svg"

export function LandingBrand({ dark = false }) {
  return (
    <Link
      to="/"
      aria-label="Accentra home"
      className="group inline-flex shrink-0 items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
    >
      <img
        src={brandLogo}
        alt=""
        className="h-8 w-auto shrink-0 sm:h-9"
      />
      <span
        className={
          dark
            ? "text-xl font-semibold tracking-[-0.03em] text-white"
            : "text-xl font-semibold tracking-[-0.03em] text-[#02353C]"
        }
      >
        Accentra
      </span>
    </Link>
  )
}

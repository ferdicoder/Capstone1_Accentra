import { Link } from "react-router-dom"

import darkLogo from "@/assets/LogoTextWhite.svg"
import lightLogo from "@/assets/LogoText.svg"

export function LandingBrand({ dark = false }) {
  return (
    <Link
      to="/"
      aria-label="Accentra home"
      className={`group inline-flex shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 ${
        dark ? "focus-visible:outline-[#6EE7B7]" : "focus-visible:outline-[#02353C]"
      }`}
    >
      <img
        src={dark ? darkLogo : lightLogo}
        alt="Accentra"
        className="h-8 w-auto shrink-0 sm:h-9"
      />
    </Link>
  )
}
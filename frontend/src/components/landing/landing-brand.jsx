import { useState } from "react"
import { Link } from "react-router-dom"

import darkLogo from "@/assets/LogoTextWhite.svg"
import lightLogo from "@/assets/LogoText.svg"
import { useFetchFirmSettings } from "@/hooks/useFirmSettings"
import { firmLogoUrl } from "@/services/api/firmSettingsAPI"

export function LandingBrand({ dark = false }) {
  const { data: settings } = useFetchFirmSettings()
  const [customFailed, setCustomFailed] = useState(false)

  const firmName = settings?.firmName?.trim()
  const customLogo = settings?.logoStorageKey && !customFailed

  return (
    <Link
      to="/"
      aria-label={firmName ? `${firmName} home` : "Accentra home"}
      className={`group inline-flex shrink-0 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 ${
        dark ? "focus-visible:outline-[#6EE7B7]" : "focus-visible:outline-[#02353C]"
      }`}
    >
      {customLogo ? (
        <img
          src={firmLogoUrl}
          alt={firmName || "Firm logo"}
          className="h-8 w-auto max-w-[10rem] shrink-0 object-contain sm:h-9"
          onError={() => setCustomFailed(true)}
        />
      ) : (
        <img
          src={dark ? darkLogo : lightLogo}
          alt="Accentra"
          className="h-8 w-auto shrink-0 sm:h-9"
        />
      )}
    </Link>
  )
}

import { useNavigate } from "react-router-dom"

import "@/components/landing/landing-motion.css"
import { LandingAbout } from "@/components/landing/landing-about"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingOverview } from "@/components/landing/landing-overview"
import { LandingProcess } from "@/components/landing/landing-process"
import { useLandingPageEffects } from "@/components/landing/use-landing-page-effects"

export default function LandingPage() {
  const navigate = useNavigate()
  useLandingPageEffects()

  const openSignIn = () => navigate("/client/signin")

  return (
    <main className="landing-page min-h-screen overflow-x-clip bg-[#fbfcfa] text-[#123b3d]">
      <LandingHero onSignIn={openSignIn} />
      <LandingOverview />
      <LandingProcess />
      <LandingAbout />
      <LandingFooter />
    </main>
  )
}
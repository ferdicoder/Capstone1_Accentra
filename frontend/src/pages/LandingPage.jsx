import { useNavigate } from "react-router-dom"

import { LandingCTA } from "@/components/landing/landing-cta"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingFooter } from "@/components/landing/landing-footer"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingProblem } from "@/components/landing/landing-problem"
import { LandingRoles } from "@/components/landing/landing-roles"
import { LandingSolution } from "@/components/landing/landing-solution"
import { LandingWorkflow } from "@/components/landing/landing-workflow"
import { useLandingScrollMotion } from "@/components/landing/use-landing-scroll-motion"

export default function LandingPage() {
  const navigate = useNavigate()
  useLandingScrollMotion()

  const openSignIn = () => navigate("/client/signin")

  return (
    <main className="landing-page min-h-screen overflow-x-clip bg-[#fbfcfa] text-[#123b3d]">
      <LandingHero onSignIn={openSignIn} />
      <LandingProblem />
      <LandingSolution />
      <LandingFeatures />
      <LandingWorkflow />
      <LandingRoles />
      <LandingCTA onSignIn={openSignIn} />
      <LandingFooter onSignIn={openSignIn} />
    </main>
  )
}

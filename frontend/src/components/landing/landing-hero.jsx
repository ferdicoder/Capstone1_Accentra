import { ArrowRight } from "lucide-react"

// 1) Large vertical photo: replace ./hero-team.jpg with your photo.
import heroImage from "./hero-team.jpg"

import { LandingNav } from "./landing-nav"
import { landingContainer } from "./landing-data"
import { useFetchFirmSettings } from "@/hooks/useFirmSettings"

// 2) Smaller landscape photo: save it as ./hero-secondary.jpg (or .jpeg, .png,
// .webp) in this folder. It is picked up automatically. Until it exists, a
// close-up crop of the main photo is shown so the layout never looks empty.
const secondaryImages = import.meta.glob("./hero-secondary.{jpg,jpeg,png,webp}", {
  eager: true,
  import: "default",
})
const secondaryImage = Object.values(secondaryImages)[0] ?? null

export function LandingHero({ onSignIn }) {
  const { data: settings } = useFetchFirmSettings()
  const firmName = settings?.firmName?.trim() || "Jobal Business Consultancy"

  return (
    <section
      id="home"
      data-landing-hero
      className="flex min-h-svh snap-start items-center overflow-x-clip bg-[#FAFBF9] pt-[4.5rem] text-[#02353C]"
    >
      <LandingNav onSignIn={onSignIn} />

      <div
        className={`${landingContainer} grid w-full items-center gap-10 py-8 lg:grid-cols-[1fr_1fr] lg:gap-12`}
      >
        <div className="landing-enter landing-hero-copy">
          <p className="inline-block border-b border-[#DCE9E5] pb-3 text-sm font-semibold tracking-[0.02em] text-[#047857] sm:text-base">
            {firmName}
          </p>
          <h1 className="mt-6 max-w-[640px] text-[clamp(2.25rem,4.6vw,4rem)] font-semibold leading-[1.04] tracking-[-0.035em] text-balance">
            Your Business, Made Simpler.
          </h1>
          <p className="mt-6 max-w-[540px] text-lg leading-[1.65] text-[#3D5F5A]">
            Providing reliable business registration and tax filing services
            to help businesses manage their essential requirements.
          </p>

          <div className="mt-8">
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#02353C] px-5 py-3 text-[0.9375rem] font-semibold text-white transition-colors hover:bg-[#0A4B52] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
            >
              Explore our services
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>

        <figure className="landing-enter landing-hero-preview mx-auto w-full max-w-[420px] [animation-delay:120ms] lg:max-w-none">
          <div className="relative ml-auto w-full pb-10 lg:max-w-[700px]">
            {/* Large vertical photo */}
            <img
              src={heroImage}
              alt="Accounting professionals meeting with a client"
              decoding="async"
              className="relative ml-auto block aspect-[4/5] max-h-[60svh] w-[80%] rounded-3xl object-cover object-[50%_35%] lg:aspect-auto lg:h-[min(66vh,600px)] lg:max-h-none lg:w-[min(100%,480px)]"
            />

            {/* Smaller landscape photo over the bottom-left corner */}
            <div className="absolute bottom-0 left-0 aspect-[4/3] w-[52%] overflow-hidden rounded-xl border-4 border-white shadow-xl shadow-[#02353C]/15 sm:rounded-2xl sm:border-[6px] lg:w-[340px]">
              <img
                src={secondaryImage ?? heroImage}
                alt={secondaryImage ? "Calculator and financial reports on a desk" : ""}
                loading="lazy"
                decoding="async"
                className={`size-full object-cover ${
                  secondaryImage ? "" : "scale-[2.2] object-[32%_62%]"
                }`}
              />
            </div>
          </div>

        </figure>
      </div>
    </section>
  )
}
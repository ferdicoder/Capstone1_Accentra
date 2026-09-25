import { ArrowRight, Check, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

import { LandingNav } from "./landing-nav"
import { LandingProductPreview } from "./landing-product-preview"
import { landingContainer } from "./landing-data"

export function LandingHero({ onSignIn }) {
  return (
    <section
      data-landing-hero
      className="relative isolate overflow-hidden bg-[#02353C] text-white"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.06)_1px,transparent_1px)] [background-size:56px_56px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 top-20 size-[30rem] rounded-full bg-emerald-400/10 blur-3xl"
      />
      <LandingNav onSignIn={onSignIn} />

      <div
        className={`${landingContainer} landing-hero-grid relative z-10 grid items-center gap-14 py-16 lg:grid-cols-[.98fr_1.02fr] lg:gap-10 lg:pb-16 lg:pt-24 xl:gap-16`}
      >
        <div className="landing-enter landing-hero-copy max-w-[840px]">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3.5 py-1.5 text-xs font-medium text-emerald-200 sm:text-[0.9375rem]">
            <Sparkles className="size-3.5" aria-hidden="true" />
            Accounting practice management
          </div>
          <h1 className="max-w-[840px] text-[clamp(2rem,5vw,4.5rem)] font-semibold leading-[0.99] tracking-[-0.055em] text-white sm:text-[clamp(3.5rem,5vw,4.5rem)] lg:text-[clamp(3.25rem,4.7vw,4.5rem)]">
            <span className="block">Every accounting</span>
            <span className="block">
              engagement, <span className="text-emerald-300">in</span>
            </span>
            <span className="block">one place.</span>
          </h1>
          <p className="mt-6 max-w-[680px] text-base leading-7 text-white/70 sm:text-[1.1875rem] sm:leading-[2.125rem]">
            Accentra brings clients, accounting firms, documents, tasks, and
            progress into one calm, connected workspace.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/client/signup"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#10B981] px-6 py-3.5 text-sm font-semibold text-[#02353C] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#34d399] hover:shadow-lg hover:shadow-emerald-950/25 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
            >
              Get started
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
            <a
              href="#features"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/20 px-6 py-3.5 text-sm font-medium text-white transition duration-200 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
            >
              Explore the workspace
            </a>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-[0.9375rem] text-white/70">
            <span>
              <Check
                className="mr-1.5 inline size-3.5 text-emerald-300"
                aria-hidden="true"
              />
              For accounting firms
            </span>
            <span>
              <Check
                className="mr-1.5 inline size-3.5 text-emerald-300"
                aria-hidden="true"
              />
              Built around engagements
            </span>
          </div>
        </div>

        <div className="landing-enter landing-hero-preview [animation-delay:120ms]">
          <LandingProductPreview />
        </div>
      </div>
    </section>
  )
}

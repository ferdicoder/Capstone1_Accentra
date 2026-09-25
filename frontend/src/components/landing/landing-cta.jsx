import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { landingContainer } from "./landing-data"

export function LandingCTA({ onSignIn }) {
  return (
    <section
      id="get-started"
      className="py-20 sm:py-24 lg:py-28"
      aria-labelledby="cta-heading"
    >
      <div className={landingContainer}>
        <div className="grid gap-10 rounded-[1.5rem] border border-[#bfe5d7] bg-[#dff8ee] p-7 sm:p-10 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-16 lg:p-14">
          <div data-landing-reveal data-reveal-order="0" className="landing-reveal">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0b916a]">
              Make room for better work
            </p>
            <h2
              id="cta-heading"
              className="mt-4 max-w-[860px] text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#02353C] sm:text-5xl"
            >
              Bring your accounting engagements into one place.
            </h2>
            <p className="mt-5 max-w-[620px] text-base leading-7 text-[#47706a] sm:text-[1.1875rem]">
              Connect clients, organize documents, track progress, and manage
              accounting work with Accentra.
            </p>
          </div>
          <div
            data-landing-reveal
            data-reveal-order="1"
            className="landing-reveal flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:justify-end"
          >
            <Link
              to="/client/signup"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#02353C] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#0a4b52] hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
            >
              Get started
              <ArrowRight className="ml-2 size-4" aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onSignIn}
              className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#8bcdb9] px-6 py-3.5 text-sm font-semibold text-[#164d4a] transition duration-200 hover:-translate-y-0.5 hover:border-[#47706a] hover:bg-white/30 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

import { Link } from "react-router-dom"

import { LandingBrand } from "./landing-brand"
import { landingContainer } from "./landing-data"

const footerLink =
  "transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"

export function LandingFooter({ onSignIn }) {
  return (
    <footer className="snap-end bg-[#062c31] py-8 text-white">
      <div
        className={`${landingContainer} flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between`}
      >
        <LandingBrand dark />

        <nav
          aria-label="Footer"
          className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/55"
        >
          <a href="#features" className={footerLink}>
            Features
          </a>
          <a href="#workflow" className={footerLink}>
            How it works
          </a>
          <Link to="/firm/signin" className={footerLink}>
            Firm sign in
          </Link>
          <button
            type="button"
            onClick={onSignIn}
            className={`${footerLink} cursor-pointer`}
          >
            Client sign in
          </button>
        </nav>
      </div>

      <div
        className={`${landingContainer} mt-6 border-t border-white/10 pt-4 text-xs text-white/35`}
      >
        © {new Date().getFullYear()} Accentra. Simplifying the way accounting
        practices work.
      </div>
    </footer>
  )
}
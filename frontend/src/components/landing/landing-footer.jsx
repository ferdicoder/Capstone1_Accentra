import { Link } from "react-router-dom"

import { LandingBrand } from "./landing-brand"
import { landingContainer } from "./landing-data"

// The footer intentionally stays outside the scroll-reveal sequence. It must
// remain fully visible at all times while keeping normal link interactions.
export function LandingFooter({ onSignIn }) {
  return (
    <footer className="bg-[#062c31] py-12 text-white sm:py-14">
      <div className={landingContainer}>
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <div>
            <LandingBrand dark />
            <p className="mt-4 max-w-[340px] text-[0.9375rem] leading-6 text-white/50">
              A shared workspace for accounting firms and the clients they
              serve.
            </p>
          </div>

          <div>
            <p className="font-semibold text-white/85">Product</p>
            <div className="mt-4 space-y-3 text-[0.9375rem] text-white/50">
              <a
                href="#features"
                className="block transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Features
              </a>
              <a
                href="#workflow"
                className="block transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                How it works
              </a>
            </div>
          </div>

          <div>
            <p className="font-semibold text-white/85">For firms</p>
            <div className="mt-4 space-y-3 text-[0.9375rem] text-white/50">
              <a
                href="#for-firms"
                className="block transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Practice view
              </a>
              <a
                href="#roles"
                className="block transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Role-based access
              </a>
              <Link
                to="/firm/signin"
                className="block transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Firm sign in
              </Link>
            </div>
          </div>

          <div>
            <p className="font-semibold text-white/85">For clients</p>
            <div className="mt-4 space-y-3 text-[0.9375rem] text-white/50">
              <a
                href="#for-clients"
                className="block transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Client experience
              </a>
              <button
                type="button"
                onClick={onSignIn}
                className="block cursor-pointer text-left transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Sign in
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-5 text-xs text-white/35">
          © {new Date().getFullYear()} Accentra. Built for clearer accounting
          work.
        </div>
      </div>
    </footer>
  )
}

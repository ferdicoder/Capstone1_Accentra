import { ArrowRight, Menu, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { LandingBrand } from "./landing-brand"
import { landingContainer, navigationLinks } from "./landing-data"

export function LandingNav({ onSignIn }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }

    document.addEventListener("keydown", handleEscape)
    return () => document.removeEventListener("keydown", handleEscape)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const openSignIn = () => {
    closeMenu()
    onSignIn()
  }

  return (
    <>
      <nav
        className={`${landingContainer} relative z-10 flex items-center justify-between py-5`}
        aria-label="Main navigation"
      >
        <LandingBrand dark />

        <div className="hidden items-center gap-8 text-[0.9375rem] text-white/65 lg:flex">
          {navigationLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="group relative inline-flex py-2 transition-colors duration-200 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-emerald-300 after:transition-transform after:duration-200 hover:after:scale-x-100"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={onSignIn}
            className="cursor-pointer rounded-lg px-4 py-2.5 text-[0.9375rem] font-medium text-white/80 transition duration-200 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
          >
            Sign in
          </button>
          <Link
            to="/client/signup"
            className="inline-flex cursor-pointer items-center rounded-lg bg-[#10B981] px-4 py-2.5 text-[0.9375rem] font-semibold text-[#02353C] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-[#34d399] hover:shadow-lg hover:shadow-emerald-950/20 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
          >
            Get started
            <ArrowRight className="ml-1.5 inline size-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          ref={menuButtonRef}
          id="landing-menu-toggle"
          type="button"
          className="cursor-pointer rounded-lg p-2.5 text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300 lg:hidden"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="landing-mobile-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X className="size-5" aria-hidden="true" />
          ) : (
            <Menu className="size-5" aria-hidden="true" />
          )}
        </button>
      </nav>

      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className="landing-menu-in relative z-10 border-t border-white/10 lg:hidden"
        >
          <div className={`${landingContainer} flex flex-col gap-4 py-5`}>
            <div className="flex flex-col gap-1 text-[0.9375rem] text-white/75">
              {navigationLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={closeMenu}
                  className="rounded-md px-1 py-2 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={openSignIn}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-white/20 px-4 py-2.5 text-[0.9375rem] font-medium text-white transition hover:border-white/40 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Sign in
              </button>
              <Link
                to="/client/signup"
                onClick={closeMenu}
                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#10B981] px-4 py-2.5 text-[0.9375rem] font-semibold text-[#02353C] transition hover:bg-[#34d399] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
              >
                Get started
                <ArrowRight className="ml-1.5 size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

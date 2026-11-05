import { Menu, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { LandingBrand } from "./landing-brand"
import { landingContainer, navigationLinks } from "./landing-data"

const link =
  "text-[0.875rem] text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7]"

export function LandingNav({ onSignIn }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => {
      if (e.key === "Escape") {
        setMenuOpen(false)
        menuButtonRef.current?.focus()
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className="border-b border-white/10 bg-[#062c31]"
        aria-label="Main navigation"
      >
        <div
          className={`${landingContainer} relative z-10 grid h-[4.5rem] grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]`}
        >
          <div className="justify-self-start">
            <LandingBrand dark />
          </div>

          <div className="hidden items-center gap-8 lg:flex">
            {navigationLinks.map((l) => (
              <a key={l.href} href={l.href} className={link}>
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center gap-4 justify-self-end lg:flex">
            <button
              type="button"
              onClick={onSignIn}
              className={`${link} cursor-pointer font-medium`}
            >
              Sign in
            </button>
            <Link
              to="/client/signup"
              className="rounded-md bg-[#10B981] px-4 py-2 text-[0.875rem] font-semibold text-[#02353C] transition-colors hover:bg-[#34D399] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7]"
            >
              Create account
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="cursor-pointer justify-self-end rounded-lg p-2 text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7] lg:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div
          id="landing-mobile-menu"
          className="landing-menu-in border-b border-white/10 bg-[#062c31] lg:hidden"
        >
          <div className={`${landingContainer} flex flex-col gap-3 py-4`}>
            {navigationLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={closeMenu}
                className={`${link} py-1.5`}
              >
                {l.label}
              </a>
            ))}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  closeMenu()
                  onSignIn()
                }}
                className="cursor-pointer rounded-md border border-white/25 px-4 py-2 text-sm font-medium text-white"
              >
                Sign in
              </button>
              <Link
                to="/client/signup"
                onClick={closeMenu}
                className="rounded-md bg-[#10B981] px-4 py-2 text-sm font-semibold text-[#02353C]"
              >
                Create account
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
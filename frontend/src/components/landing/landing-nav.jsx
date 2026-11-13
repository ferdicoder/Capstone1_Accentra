import { Menu, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Link, useLocation } from "react-router-dom"

import { authStore } from "@/store/authStore"
import { LandingBrand } from "./landing-brand"
import { landingContainer, navigationLinks } from "./landing-data"

// Must match the value your authStore uses for client accounts.
const CLIENT_ROLE = "client"

const link =
  "text-[0.875rem] text-white/75 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7]"

// Active state: brighter text plus a mint underline bar.
const linkActive =
  "!text-white font-medium after:absolute after:inset-x-0 after:-bottom-1.5 after:h-0.5 after:rounded-full after:bg-[#6EE7B7]"

const mobileLinkActive = "!text-[#6EE7B7] font-medium"

/**
 * @param {boolean} [showLinks] - Optional manual override. When omitted, the
 *   Home / Service / How it works / About links show for Client accounts and
 *   for signed-out visitors on public or client pages. They are hidden on
 *   firm-side pages and for Admin, Firm Staff and Billing Officer accounts.
 */
export function LandingNav({ onSignIn, sectionPrefix = "", showLinks }) {
  const role = authStore((state) => state.role)
  const { pathname } = useLocation()

  // Firm-side pages (including the signed-out firm sign-in) never show the links.
  const isFirmSide =
    pathname.startsWith("/firm") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/billing-officer")

  const authActionsVisible = !isFirmSide
  const linksVisible =
    showLinks ?? (!isFirmSide && (!role || role === CLIENT_ROLE))

  const [menuOpen, setMenuOpen] = useState(false)
  const [activeHref, setActiveHref] = useState(() => {
    if (typeof window === "undefined") return ""
    const hash = window.location.hash
    return navigationLinks.some((l) => l.href === hash) ? hash : ""
  })
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

  // Scroll-spy: highlight the link whose section crosses the middle of the viewport.
  useEffect(() => {
    if (!linksVisible || typeof IntersectionObserver === "undefined") return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveHref(`#${entry.target.id}`)
        })
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    )

    navigationLinks.forEach(({ href }) => {
      const section = document.querySelector(href)
      if (section) observer.observe(section)
    })

    return () => observer.disconnect()
  }, [linksVisible, pathname])

  // Keep the highlight in sync when the hash changes (Back/Forward, manual edits).
  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash
      if (navigationLinks.some((l) => l.href === hash)) setActiveHref(hash)
    }
    window.addEventListener("hashchange", onHashChange)
    return () => window.removeEventListener("hashchange", onHashChange)
  }, [])

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav
        className="relative border-b border-white/10 bg-[#062c31]"
        aria-label="Main navigation"
      >
        <div
          className={`${landingContainer} relative z-10 grid h-[4.5rem] grid-cols-[1fr_auto] items-center lg:grid-cols-[1fr_auto_1fr]`}
        >
          <div className="justify-self-start">
            <LandingBrand dark />
          </div>

          {/* Middle grid column. An empty placeholder keeps the actions on
              the right when the links are hidden. */}
          {linksVisible ? (
            <div className="hidden items-center gap-8 lg:flex">
              {navigationLinks.map((l) => {
                const isActive = activeHref === l.href
                return (
                  <a
                    key={l.href}
                    href={`${sectionPrefix}${l.href}`}
                    onClick={() => setActiveHref(l.href)}
                    aria-current={isActive ? "location" : undefined}
                    className={`${link} relative ${isActive ? linkActive : ""}`}
                  >
                    {l.label}
                  </a>
                )
              })}
            </div>
          ) : (
            <div className="hidden lg:block" aria-hidden="true" />
          )}

          {isFirmSide ? (
            <div className="justify-self-end text-sm font-semibold tracking-wide text-white">
              Firm Portal
            </div>
          ) : authActionsVisible && (
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
                className="rounded-md bg-white px-4 py-2 text-[0.875rem] font-semibold text-[#02353C] transition-colors hover:bg-[#E6F7EF] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7]"
              >
                Create account
              </Link>
            </div>
          )}

          {(linksVisible || authActionsVisible) && (
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
          )}
        </div>
      </nav>

      {menuOpen && (linksVisible || authActionsVisible) && (
        <div
          id="landing-mobile-menu"
          className="landing-menu-in border-b border-white/10 bg-[#062c31] lg:hidden"
        >
          <div className={`${landingContainer} flex flex-col gap-3 py-4`}>
            {linksVisible &&
              navigationLinks.map((l) => {
                const isActive = activeHref === l.href
                return (
                  <a
                    key={l.href}
                    href={`${sectionPrefix}${l.href}`}
                    onClick={() => {
                      setActiveHref(l.href)
                      closeMenu()
                    }}
                    aria-current={isActive ? "location" : undefined}
                    className={`${link} py-1.5 ${isActive ? mobileLinkActive : ""}`}
                  >
                    {l.label}
                  </a>
                )
              })}
            {authActionsVisible && (
              <div className={`flex gap-3 ${linksVisible ? "pt-2" : ""}`}>
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
                  className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-[#02353C] transition-colors hover:bg-[#E6F7EF]"
                >
                  Create account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
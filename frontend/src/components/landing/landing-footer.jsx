import { landingContainer } from "./landing-data"
import { useFetchFirmSettings } from "@/hooks/useFirmSettings"

const quickLinks = [
  { label: "Home", href: "#home" },
  { label: "Service", href: "#features" },
  { label: "How It Works", href: "#workflow" },
  { label: "About", href: "#about" },
]

const services = ["Business Registration", "Tax Filing"]

const footerLink =
  "text-sm text-white/70 transition-colors hover:text-[#6EE7B7] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6EE7B7]"

export function LandingFooter() {
  const { data: settings } = useFetchFirmSettings()
  const firmName = settings?.firmName?.trim() || "Jobal Business Consultancy"
  const copyrightYear = new Date().getFullYear()

  return (
    <footer className="snap-end bg-[#062c31] text-white">
      <div
        className={`${landingContainer} grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] lg:gap-16 lg:py-14`}
      >
        <div className="max-w-md">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            {firmName}
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/65">
            Supporting businesses since 2006 through business registration and
            tax filing services.
          </p>
        </div>

        <nav aria-label="Quick links">
          <h3 className="text-sm font-semibold text-white">Quick Links</h3>
          <ul className="mt-4 flex flex-col items-start gap-3">
            {quickLinks.map(({ label, href }) => (
              <li key={href}>
                <a href={href} className={footerLink}>
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-semibold text-white">Our Services</h3>
          <ul className="mt-4 flex flex-col gap-3 text-sm text-white/70">
            {services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div
          className={`${landingContainer} flex flex-col gap-2 py-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between`}
        >
          <p>© {copyrightYear} {firmName}. All rights reserved.</p>
          <p>
            Powered by <span className="font-medium text-white/75">Accentra</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

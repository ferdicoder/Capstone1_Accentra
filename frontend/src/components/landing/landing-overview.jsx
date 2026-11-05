import { Landing3DLogo } from "./landing-3d-logo"
import { features, landingContainer, ui } from "./landing-data"

export function LandingOverview() {
  return (
    <section
      id="features"
      className="flex min-h-[calc(100svh-4.5rem)] snap-start items-center bg-white py-12"
      aria-labelledby="overview-heading"
    >
      <div
        className={`${landingContainer} grid w-full gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-16`}
      >
        <div data-reveal className="landing-reveal">
          <div className="relative h-[11rem] w-full">
            <Landing3DLogo className="left-0 top-1/2 h-[11rem] w-[11rem]" />
          </div>
          <h2
            id="overview-heading"
            className={`mt-6 max-w-[520px] ${ui.h2} text-[#02353C]`}
          >
            One workspace for every engagement.
          </h2>
          <p className={`mt-5 max-w-[480px] ${ui.lead} text-[#3D5F5A]`}>
            Managing engagements gets harder when client information,
            documents, tasks, and payments are scattered. Accentra brings them
            together.
          </p>
        </div>

        <ul
          data-reveal
          style={{ "--reveal-delay": "150ms" }}
          className="landing-reveal grid gap-x-10 sm:grid-cols-2"
        >
          {features.map(({ title, description }) => (
            <li key={title} className="border-t border-[#DCE9E5] py-4">
              <h3 className="font-semibold text-[#02353C]">{title}</h3>
              <p className="mt-1 text-sm leading-5 text-[#3D5F5A]">
                {description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
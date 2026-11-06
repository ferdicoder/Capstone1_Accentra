import { Landing3DLogo } from "./landing-3d-logo"
import { landingContainer, ui } from "./landing-data"

export function LandingAbout() {
  return (
    <section
      id="about"
      className="flex min-h-[calc(100svh-4.5rem)] snap-start items-center bg-[#F2F7F4] py-12"
      aria-labelledby="about-heading"
    >
      <div
        className={`${landingContainer} grid w-full items-center gap-8 lg:grid-cols-[1fr_.8fr] lg:gap-16`}
      >
        <div
          data-reveal
          className="landing-reveal mx-auto max-w-3xl text-center lg:mx-0 lg:text-left"
        >
          <p className="text-sm font-semibold tracking-wide text-[#047857]">
            Accounting Services by JOBAL
          </p>
          <h2 id="about-heading" className={`mt-4 ${ui.h2} text-[#02353C]`}>
            Supporting Businesses Since 2006.
          </h2>
          <p className={`mx-auto mt-5 max-w-2xl ${ui.lead} text-[#3D5F5A] lg:mx-0`}>
            Accounting Services by JOBAL provides business registration and
            tax filing services, helping businesses manage their essential
            requirements with confidence.
          </p>
        </div>
        <div
          data-reveal
          className="landing-reveal relative mx-auto h-[18rem] w-full max-w-[22rem] lg:mx-0"
        >
          <Landing3DLogo
            animateEntrance={false}
            animateFloatRotate
            className="left-0 top-1/2 h-[18rem] w-[18rem]"
          />
        </div>
      </div>
    </section>
  )
}

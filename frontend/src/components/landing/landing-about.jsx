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
            Based in Quezon City, Philippines, Accounting Services by JOBAL
            provides Tax Filing and Business Registration Assistance to help
            businesses manage their essential requirements.
          </p>
          <div className="mx-auto mt-8 max-w-2xl border-t border-[#DCE9E5] pt-6 lg:mx-0">
            <h3 className="text-lg font-semibold text-[#02353C]">
              Get in Touch
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#3D5F5A]">
              For inquiries and concerns about our services, you may contact
              Accounting Services by JOBAL through our official email address.
            </p>
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=jetjojet%40gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block font-medium text-[#047857] underline decoration-[#10B981] underline-offset-4 transition-colors hover:text-[#02353C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#02353C]"
            >
              jetjojet@gmail.com
            </a>
          </div>
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

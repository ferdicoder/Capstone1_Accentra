import { Check, LayoutDashboard } from "lucide-react"

import {
  landingContainer,
  solutionDetails,
  solutionHighlights,
  solutionNodes,
} from "./landing-data"

function SolutionNode({ label, description, icon: Icon }) {
  return (
    <article className="relative rounded-2xl border border-[#dce9e5] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex size-10 items-center justify-center rounded-xl bg-[#e0f8ee] text-[#07956b]">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-base font-semibold text-[#02353C] sm:text-lg">
        {label}
      </h3>
      <p className="mt-1.5 text-[0.9375rem] leading-6 text-[#47706a]">{description}</p>
    </article>
  )
}

export function LandingSolution() {
  return (
    <section
      id="solution"
      className="py-20 sm:py-24 lg:py-28"
      aria-labelledby="solution-heading"
    >
      <div
        className={`${landingContainer} grid items-center gap-14 lg:grid-cols-[.88fr_1.12fr] lg:gap-20`}
      >
        <div data-landing-reveal data-reveal-order="0" className="landing-reveal">
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[#0b916a]">
            A connected practice
          </p>
          <h2
            id="solution-heading"
            className="mt-4 max-w-[760px] text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-[#02353C] sm:text-5xl lg:text-[3.5rem]"
          >
            One connected workspace for the entire engagement.
          </h2>
          <p className="mt-6 max-w-[660px] text-base leading-7 text-[#47706a] sm:text-[1.1875rem] sm:leading-[2.125rem]">
            Accentra gives clients, accounting firms, and firm staff a shared
            view of the work, the documents, and the updates that matter from
            request to completion.
          </p>
          <div className="mt-8 space-y-3 text-[0.9375rem] leading-6 text-[#164d4a]">
            {solutionHighlights.map((item, index) => (
              <p
                key={item}
                data-landing-reveal
                data-reveal-order={index + 1}
                className="landing-reveal flex items-start gap-3"
              >
                <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#dff8ee] text-xs font-semibold text-[#0b916a]">
                  0{index + 1}
                </span>
                {item}
              </p>
            ))}
          </div>
        </div>

        <div data-landing-reveal data-reveal-order="2" className="landing-reveal">
          <div className="rounded-2xl border border-[#dce9e5] bg-[#f2f7f4] p-4 sm:p-6 lg:p-8">
            <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:gap-2">
              {solutionNodes.map((node, index) => (
                <div key={node.label} className="contents">
                  <SolutionNode {...node} />
                  {index < solutionNodes.length - 1 && (
                    <div
                      aria-hidden="true"
                      className="flex items-center justify-center py-1 text-xl text-[#77b9a6] sm:py-0 sm:text-2xl"
                    >
                      <span className="sm:hidden">↓</span>
                      <span className="hidden sm:inline">↔</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-[#02353C] bg-[#02353C] p-4 text-white shadow-xl shadow-[#02353C]/10 sm:mt-6 sm:p-5">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-300">
                  <LayoutDashboard className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold">Accentra</p>
                  <p className="mt-1 text-[0.9375rem] leading-6 text-white/65">
                    One shared engagement layer for the people, process, and
                    progress behind the work.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <ul
            className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3"
            aria-label="Connected engagement areas"
          >
            {solutionDetails.map((detail) => (
              <li
                key={detail}
                className="flex items-start gap-2 rounded-lg border border-[#dce9e5] bg-white px-3 py-2.5 text-xs leading-5 text-[#47706a]"
              >
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-[#0b916a]"
                  aria-hidden="true"
                />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

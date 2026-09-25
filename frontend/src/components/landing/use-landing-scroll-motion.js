import { useEffect } from "react"

const clamp = (value) => Math.min(1, Math.max(0, value))

/**
 * Drives the landing page's scroll-linked CSS state from one passive,
 * requestAnimationFrame loop. The footer intentionally has no
 * `data-landing-reveal` elements, so it stays fully visible.
 */
export function useLandingScrollMotion() {
  useEffect(() => {
    const motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    )
    let frameId = 0

    const updateMotion = () => {
      frameId = 0
      const viewportHeight = window.innerHeight || 1
      const reducedMotion = motionPreference.matches

      document
        .querySelectorAll("[data-landing-reveal]")
        .forEach((element) => {
          const rect = element.getBoundingClientRect()
          const order = Number.parseInt(
            element.getAttribute("data-reveal-order") || "0",
            10,
          )
          let progress = 1

          // Content well below the viewport remains fully visible. Once it
          // approaches the reading area, its position and opacity respond to
          // the user's scroll instead of appearing in a single binary step.
          if (
            !reducedMotion &&
            rect.top < viewportHeight * 1.15 &&
            rect.bottom > -viewportHeight * 0.2
          ) {
            const start =
              viewportHeight * (0.82 + Math.min(order, 8) * 0.055)
            const distance = Math.max(viewportHeight * 0.56, 180)
            progress = clamp((start - rect.top) / distance)
          }

          element.style.setProperty(
            "--landing-reveal-opacity",
            `${0.24 + progress * 0.76}`,
          )
          element.style.setProperty(
            "--landing-reveal-offset",
            `${(1 - progress) * 26}px`,
          )
        })

      const hero = document.querySelector("[data-landing-hero]")
      if (hero) {
        const rect = hero.getBoundingClientRect()
        const distance = Math.max(rect.height * 0.9, viewportHeight * 0.75)
        const progress = reducedMotion
          ? 0
          : clamp(-rect.top / distance)

        hero.style.setProperty(
          "--landing-hero-copy-offset",
          `${progress * -24}px`,
        )
        hero.style.setProperty(
          "--landing-hero-copy-opacity",
          `${1 - progress * 0.28}`,
        )
        hero.style.setProperty(
          "--landing-hero-preview-offset",
          `${progress * 14}px`,
        )
        hero.style.setProperty(
          "--landing-hero-preview-scale",
          `${1 - progress * 0.025}`,
        )
      }

      const workflowLine = document.querySelector(
        "[data-landing-workflow-progress]",
      )
      if (workflowLine) {
        const rect = workflowLine.getBoundingClientRect()
        const start = viewportHeight * 0.84
        const end = viewportHeight * 0.28
        const distance = Math.max(rect.height + start - end, 1)
        const progress = reducedMotion
          ? 1
          : clamp((start - rect.top) / distance)
        workflowLine.style.setProperty(
          "--landing-workflow-progress",
          `${Math.max(0.08, progress)}`,
        )
      }
    }

    const scheduleMotionUpdate = () => {
      if (!frameId) {
        frameId = window.requestAnimationFrame(updateMotion)
      }
    }

    updateMotion()
    window.addEventListener("scroll", scheduleMotionUpdate, { passive: true })
    window.addEventListener("resize", scheduleMotionUpdate)
    motionPreference.addEventListener?.("change", scheduleMotionUpdate)

    return () => {
      window.removeEventListener("scroll", scheduleMotionUpdate)
      window.removeEventListener("resize", scheduleMotionUpdate)
      motionPreference.removeEventListener?.("change", scheduleMotionUpdate)
      if (frameId) window.cancelAnimationFrame(frameId)
    }
  }, [])
}

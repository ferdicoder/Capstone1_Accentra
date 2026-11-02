export function scrollToFirstInvalidField(form) {
  if (!form) return

  window.requestAnimationFrame(() => {
    const invalidField = form.querySelector(
      '[data-invalid-field="true"], [aria-invalid="true"]'
    )
    if (!invalidField) return

    invalidField.scrollIntoView({ behavior: "smooth", block: "center" })
    const focusTarget = invalidField.matches(
      "input, select, textarea, button, [tabindex]:not([tabindex='-1'])"
    )
      ? invalidField
      : invalidField.querySelector(
          "input:not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled), [tabindex]:not([tabindex='-1'])"
        )
    focusTarget?.focus({ preventScroll: true })
  })
}

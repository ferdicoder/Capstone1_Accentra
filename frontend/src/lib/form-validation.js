export function getZodFieldErrors(schema, values) {
  const result = schema.safeParse(values)
  if (result.success) return {}

  return result.error.issues.reduce((errors, issue) => {
    const field = issue.path.join(".")
    if (field && !errors[field]) errors[field] = issue.message
    return errors
  }, {})
}

export function sanitizePhoneInput(value) {
  return value.replace(/[^\d+\s-]/g, "")
}

export function sanitizeNameInput(value) {
  return value.replace(/[^\p{L}\p{M}\s.'’-]/gu, "")
}

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

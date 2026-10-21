/**
 * Password rules used by the password forms across the app.
 *
 * They live here so every form validates new passwords against the same
 * rules the application already enforces (see ClientProfilePage and
 * ForgotPasswordModal) instead of each screen keeping its own copy.
 */
export const passwordRequirements = [
  { key: "lowercase", label: "At least one lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { key: "uppercase", label: "At least one uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "At least one number", test: (pw) => /[0-9]/.test(pw) },
  { key: "minLength", label: "Minimum 8 characters", test: (pw) => pw.length >= 8 },
]

/** True when the password satisfies every requirement above. */
export const isPasswordValid = (password) =>
  passwordRequirements.every((requirement) => requirement.test(password ?? ""))

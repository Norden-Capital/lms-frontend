/**
 * Shared by the two "choose a password from an email link" actions.
 *
 * <p>Lives outside the `"use server"` files on purpose: every export there
 * becomes a callable endpoint, and a type or a plain helper among them breaks
 * every action in the file.
 */

export type SetPasswordState = {
  message?: string
  fieldErrors?: Record<string, string>
}

/** Mirrors the backend's rule, so the common mistake is caught without a round trip. */
const MIN_LENGTH = 8

/**
 * The token and the new password from the form, or what is wrong with them.
 * Checked here as well as in the browser: a Server Action is a public POST
 * endpoint, so `required` on an input proves nothing.
 */
export function readNewPassword(
  formData: FormData
): { value: { token: string; password: string } } | { problem: SetPasswordState } {
  const token = String(formData.get("token") ?? "")
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")

  if (!token) {
    return { problem: { message: "This link is incomplete. Open it again from your email." } }
  }
  if (password.length < MIN_LENGTH) {
    return { problem: { fieldErrors: { password: `Use at least ${MIN_LENGTH} characters` } } }
  }
  if (password !== confirm) {
    return { problem: { fieldErrors: { confirm: "The two passwords don't match" } } }
  }

  return { value: { token, password } }
}

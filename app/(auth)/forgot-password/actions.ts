"use server"

import { apiFetch } from "@/lib/api"

export type ForgotPasswordState = {
  sent?: boolean
  email?: string
  message?: string
}

/**
 * Asks the backend to email a reset link.
 *
 * <p>The backend answers the same whether or not the address has an account, so
 * this does too: a "sent" screen either way. Only a real failure — the backend
 * unreachable, an invalid address — stays on the form.
 */
export async function requestPasswordReset(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim()

  if (!email) return { message: "Email is required" }

  const result = await apiFetch<{ message: string }>("/api/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  })

  if (!result.ok) {
    return { email, message: result.error.fieldErrors?.email ?? result.error.message }
  }

  return { sent: true, email }
}

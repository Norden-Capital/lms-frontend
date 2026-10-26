"use server"

import { revalidatePath } from "next/cache"

import { apiFetch } from "@/lib/api"

/** Mirrors the backend's MfaConfirmResponse — the same shape enrolment returns. */
type MfaConfirmResponse = {
  message: string
  recoveryCodes: string[]
}

export type RegenerateState = {
  recoveryCodes?: string[]
  message?: string
  fieldErrors?: Record<string, string>
}

/**
 * Issues a fresh set of recovery codes and destroys the old ones.
 *
 * <p>Takes the current password even though the caller is already signed in.
 * Being logged in is not enough for something this sensitive: an unlocked
 * laptop left on a desk would otherwise be all it takes to walk off with ten
 * working ways into the account.
 */
export async function regenerateCodes(
  _prevState: RegenerateState,
  formData: FormData
): Promise<RegenerateState> {
  const password = String(formData.get("password") ?? "")

  if (!password) {
    return { fieldErrors: { password: "Your current password is required" } }
  }

  const result = await apiFetch<MfaConfirmResponse>(
    "/api/auth/2fa/recovery-codes",
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ password }),
    }
  )

  if (!result.ok) {
    return {
      message: result.error.message,
      fieldErrors: result.error.fieldErrors,
    }
  }

  return { recoveryCodes: result.data.recoveryCodes }
}

export type ChangePasswordState = {
  ok?: boolean
  message?: string
  fieldErrors?: Record<string, string>
}

/**
 * Your own password — added 2026-10-26. The two new boxes must match before
 * anything is sent. Every other session ends on the server.
 */
export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "")
  const newPassword = String(formData.get("newPassword") ?? "")
  const repeat = String(formData.get("repeat") ?? "")

  if (!currentPassword) return { fieldErrors: { currentPassword: "Type your current password" } }
  if (newPassword.length < 8) return { fieldErrors: { newPassword: "Use at least 8 characters" } }
  if (newPassword !== repeat) return { fieldErrors: { repeat: "The two passwords are not the same" } }

  const result = await apiFetch<{ message: string }>("/api/users/me/password", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ currentPassword, newPassword }),
  })
  if (!result.ok) return { message: result.error.message, fieldErrors: result.error.fieldErrors }

  revalidatePath("/settings/security")
  return { ok: true, message: result.data.message }
}

/** Signs out one of your sessions. */
export async function endSession(id: string): Promise<{ ok: boolean; message: string }> {
  const result = await apiFetch<{ message: string }>(`/api/users/me/sessions/${encodeURIComponent(id)}`, {
    method: "DELETE",
    authenticated: true,
  })
  revalidatePath("/settings/security")
  return result.ok ? { ok: true, message: result.data.message } : { ok: false, message: result.error.message }
}

/** Signs out every session but this one. */
export async function endOtherSessions(): Promise<{ ok: boolean; message: string }> {
  const result = await apiFetch<{ message: string }>("/api/users/me/sessions/end-others", {
    method: "POST",
    authenticated: true,
  })
  revalidatePath("/settings/security")
  return result.ok ? { ok: true, message: result.data.message } : { ok: false, message: result.error.message }
}

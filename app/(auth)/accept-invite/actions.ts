"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { SetPasswordState } from "@/lib/setPasswordState"
import { readNewPassword } from "@/lib/setPasswordState"

/**
 * Accepting an invitation by choosing a first password. The account becomes
 * active; signing in then takes them to two-factor enrolment.
 */
export async function acceptInvitation(
  _prevState: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const read = readNewPassword(formData)
  if ("problem" in read) return read.problem

  const result = await apiFetch<{ message: string }>("/api/auth/invitation/accept", {
    method: "POST",
    body: JSON.stringify(read.value),
  })

  if (!result.ok) {
    return { message: result.error.message, fieldErrors: result.error.fieldErrors }
  }

  redirect("/login?reason=account-ready")
}

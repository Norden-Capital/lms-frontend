"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { SetPasswordState } from "@/lib/setPasswordState"
import { readNewPassword } from "@/lib/setPasswordState"

/** Choosing a new password from the emailed reset link. */
export async function resetPassword(
  _prevState: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const read = readNewPassword(formData)
  if ("problem" in read) return read.problem

  const result = await apiFetch<{ message: string }>("/api/auth/password/reset", {
    method: "POST",
    body: JSON.stringify(read.value),
  })

  if (!result.ok) {
    return { message: result.error.message, fieldErrors: result.error.fieldErrors }
  }

  redirect("/login?reason=password-changed")
}

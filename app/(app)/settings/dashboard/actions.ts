"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { ActionState } from "@/lib/actionState"

/**
 * Your own name and phone, from My dashboard — added 2026-10-26. Anyone signed
 * in may change their own; the email never changes.
 */
export async function updateMyDetails(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const result = await apiFetch("/api/users/me", {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify({
      firstName: String(formData.get("firstName") ?? "").trim(),
      lastName: String(formData.get("lastName") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
    }),
  })

  if (!result.ok) {
    if (result.error.status === 401) redirect("/login?reason=session-expired")
    return { ok: false, message: result.error.message, fieldErrors: result.error.fieldErrors }
  }

  // The whole app shows your name (the header, the settings column), so all of it repaints.
  revalidatePath("/", "layout")
  return { ok: true, message: "Details saved." }
}

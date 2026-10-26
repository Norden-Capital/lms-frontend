"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import type { ActionState } from "@/lib/actionState"

/**
 * Changing the brands on Configuration → Brands — the Owner only.
 *
 * <p>⚠️ Only async functions may be exported from a `"use server"` file.
 */

function failure(error: { status: number; message: string; fieldErrors?: Record<string, string> }): ActionState {
  if (error.status === 401) redirect("/login?reason=session-expired")
  const fields = error.fieldErrors ? Object.values(error.fieldErrors).join(" ") : ""
  return { ok: false, message: fields || error.message }
}

async function done(path: string, init: RequestInit): Promise<ActionState> {
  const result = await apiFetch(path, { ...init, authenticated: true })
  if (!result.ok) return failure(result.error)

  revalidatePath("/configuration/brands")
  revalidatePath("/inbox")
  return { ok: true }
}

/** Adds a brand by its website — the name and logo are read from it. */
export async function addBrand(website: string): Promise<ActionState> {
  return done("/api/brands", { method: "POST", body: JSON.stringify({ website }) })
}

/** Fixes the name or the address — clicked and typed in the table. */
export async function updateBrand(id: string, name: string, email: string): Promise<ActionState> {
  return done(`/api/brands/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ name, email }),
  })
}

/** Reads the name and logo from the website again. */
export async function refreshBrand(id: string): Promise<ActionState> {
  return done(`/api/brands/${encodeURIComponent(id)}/refresh`, { method: "POST" })
}

/** Sets the brand's Google Analytics ID; empty removes it. */
export async function setBrandGa4(id: string, propertyId: string): Promise<ActionState> {
  const result = await done(`/api/brands/${encodeURIComponent(id)}/ga4`, {
    method: "PUT",
    body: JSON.stringify({ propertyId }),
  })
  if (result.ok) revalidatePath("/dashboard/seo")
  return result
}

export async function setBrandActive(id: string, active: boolean): Promise<ActionState> {
  return done(`/api/brands/${encodeURIComponent(id)}/active`, {
    method: "PUT",
    body: JSON.stringify({ active }),
  })
}

export async function deleteBrand(id: string): Promise<ActionState> {
  return done(`/api/brands/${encodeURIComponent(id)}`, { method: "DELETE" })
}

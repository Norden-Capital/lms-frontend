"use server"

import { redirect } from "next/navigation"

import { apiFetch } from "@/lib/api"
import { destroySession } from "@/lib/session"

/**
 * Clears the session cookie and sends the user back to sign-in.
 *
 * The cookie is httpOnly, so the browser cannot clear it itself — this has to
 * happen on the server. `destroySession` drops the half-way MFA cookie too, so
 * an interrupted login does not leave a stale challenge behind.
 */
export async function logout() {
  // Ends this session on the server, so the token is dead even if it was
  // copied — added 2026-10-26. A failure here must not keep anyone signed in.
  await apiFetch("/api/users/me/logout", { method: "POST", authenticated: true }).catch(() => null)
  await destroySession()
  // Throws a framework control-flow exception; nothing after it runs.
  redirect("/login")
}

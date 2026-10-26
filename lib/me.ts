import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { SignInDay } from "@/lib/actionLogTypes"

/**
 * The signed-in person's own history, for My dashboard in Settings. Anyone
 * signed in may read these, and only ever about themselves.
 */

/** One place you are signed in. Mirrors the backend's SessionResponse. */
export type MySession = {
  id: string
  userAgent: string | null
  ip: string | null
  createdAt: string
  lastSeenAt: string
  /** The session this page was loaded with. */
  current: boolean
}

/** Where you are signed in, most recently used first. */
export async function getMySessions(): Promise<ApiResult<MySession[]>> {
  return apiFetch<MySession[]>("/api/users/me/sessions", { authenticated: true })
}

/** Every day you signed in, or had a wrong try. */
export async function getMySignIns(): Promise<ApiResult<SignInDay[]>> {
  return apiFetch<SignInDay[]>("/api/users/me/sign-ins", { authenticated: true })
}

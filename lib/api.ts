import "server-only"

import { headers as incomingHeaders } from "next/headers"

import { getSessionToken } from "@/lib/session"

/**
 * Server-side calls to the backend.
 *
 * The browser never talks to the backend directly — it only ever calls this app,
 * which forwards from the server. That keeps the backend address out of the
 * client bundle and lets the access token stay in an httpOnly cookie.
 */
const BACKEND_URL = process.env.BACKEND_URL

/** Shape the backend's GlobalExceptionHandler returns on every error. */
export type ApiError = {
  status: number
  error: string
  message: string
  path?: string
  fieldErrors?: Record<string, string>
}

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export async function apiFetch<T>(
  path: string,
  init: RequestInit & { authenticated?: boolean } = {}
): Promise<ApiResult<T>> {
  if (!BACKEND_URL) {
    return {
      ok: false,
      error: {
        status: 500,
        error: "Configuration",
        message: "BACKEND_URL is not set. Copy .env.example to .env.local.",
      },
    }
  }

  const { authenticated, headers, ...rest } = init
  const requestHeaders = new Headers(headers)
  requestHeaders.set("Content-Type", "application/json")

  // The visitor's own address, for the backend's rate limits and action log —
  // decided 2026-10-19. Every call arrives from this server, so without it the
  // backend would see the same few Vercel addresses for everybody. The shared
  // secret is what makes the backend believe the header; without it the header
  // is ignored, as it should be from anybody else.
  const proxySecret = process.env.PROXY_SECRET
  if (proxySecret) {
    const visitor = await visitorAddress()
    if (visitor) {
      requestHeaders.set("X-Client-IP", visitor)
      requestHeaders.set("X-Proxy-Secret", proxySecret)
    }
  }

  if (authenticated) {
    const token = await getSessionToken()
    if (!token) {
      return {
        ok: false,
        error: { status: 401, error: "Unauthorized", message: "Not signed in." },
      }
    }
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  let response: Response
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...rest,
      headers: requestHeaders,
      // Auth responses are per-user and must never be cached.
      cache: "no-store",
    })
  } catch {
    // The backend being unreachable is a normal operational state, not a crash.
    return {
      ok: false,
      error: {
        status: 503,
        error: "Service Unavailable",
        message: "Could not reach the server. Please try again.",
      },
    }
  }

  const body = await response.text()
  const parsed = body ? safeJson(body) : null

  if (!response.ok) {
    return {
      ok: false,
      error: {
        status: response.status,
        error: parsed?.error ?? response.statusText,
        message: parsed?.message ?? "Something went wrong. Please try again.",
        fieldErrors: parsed?.fieldErrors,
      },
    }
  }

  return { ok: true, data: parsed as T }
}

function safeJson(text: string) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * Where the request this server is handling came from. Vercel puts the real
 * visitor first in x-forwarded-for. Null outside a request — at build time —
 * where there is no visitor to speak of.
 */
async function visitorAddress(): Promise<string | null> {
  try {
    const incoming = await incomingHeaders()
    const chain = incoming.get("x-forwarded-for")
    if (chain) return chain.split(",")[0].trim()
    return incoming.get("x-real-ip")
  } catch {
    return null
  }
}

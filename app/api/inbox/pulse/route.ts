import { NextResponse } from "next/server"

import { apiFetch } from "@/lib/api"
import type { InboxPulse } from "@/lib/mailTypes"

/**
 * The inbox's unread count, and whether new mail arrived — asked for often by
 * the header dot and by the inbox itself. Through here because the access
 * token is in a cookie the browser cannot read.
 */

export const runtime = "nodejs"

export async function GET() {
  const result = await apiFetch<InboxPulse>("/api/inbox/pulse", { authenticated: true })

  if (!result.ok) {
    return NextResponse.json(
      { message: result.error.message },
      { status: result.error.status, headers: { "Cache-Control": "no-store" } }
    )
  }

  return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } })
}

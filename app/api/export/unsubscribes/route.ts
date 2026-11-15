import { NextResponse, type NextRequest } from "next/server"

import { apiDownload } from "@/lib/api"
import { addSort, unsubscribeFilters } from "@/lib/unsubscribes"
import type { UnsubscribesQuery } from "@/lib/unsubscribeTypes"

/**
 * Downloading the Unsubscribes list as a CSV file, with the filters on screen.
 * Only the ticked rows when `ids` is given (at most 1,000), otherwise the
 * filters. The backend builds the file and writes it to the action log
 * (UNSUBSCRIBES_EXPORTED); this only passes it on. A Route Handler and a plain
 * link, like the other exports, so the browser owns the save dialog.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const query: UnsubscribesQuery = {
    search: params.get("search") ?? undefined,
    brand: params.get("brand") ?? undefined,
    reason: params.get("reason") ?? undefined,
    period: params.get("period") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  }

  const ids = (params.get("ids") ?? "").split(",").map((id) => id.trim()).filter(Boolean)
  if (ids.length > 1000) {
    return NextResponse.json({ message: "You can export up to 1,000 ticked rows." }, { status: 400 })
  }
  // Ticked rows ignore the filters: they were picked by hand.
  const backend = ids.length > 0 ? new URLSearchParams() : unsubscribeFilters(query)
  ids.forEach((id) => backend.append("ids", id))
  addSort(backend, params.get("sort") ?? undefined)

  const answer = await apiDownload(`/api/unsubscribes/export?${backend}`)
  if (!answer) {
    return NextResponse.json({ message: "Could not reach the server. Please try again." }, { status: 503 })
  }
  if (!answer.ok) {
    const body = await answer.json().catch(() => ({}))
    return NextResponse.json(
      { message: body.message ?? "Could not export the list." },
      { status: answer.status }
    )
  }

  return new Response(answer.body, {
    headers: {
      "Content-Type": answer.headers.get("content-type") ?? "text/csv; charset=utf-8",
      "Content-Disposition":
        answer.headers.get("content-disposition") ??
        `attachment; filename="unsubscribes-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"

/** The channels with a link, by name — the Owner only. SEO is not one: it needs no link. */
export async function listChannels(): Promise<ApiResult<string[]>> {
  return apiFetch<string[]>("/api/channels", { authenticated: true })
}

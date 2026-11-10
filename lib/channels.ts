import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"

/** The channels with a link, by name — the Owner only. SEO is not one: it needs no link. */
export async function listChannels(): Promise<ApiResult<string[]>> {
  return apiFetch<string[]>("/api/channels", { authenticated: true })
}

/**
 * This year's applies per channel and brand — channel → brand id → count.
 * Counted like Brands' Applies: forms sent in full, real ones only.
 */
export type ChannelApplies = Record<string, Record<string, number>>

export async function listChannelApplies(): Promise<ApiResult<ChannelApplies>> {
  return apiFetch<ChannelApplies>("/api/channels/applies", { authenticated: true })
}

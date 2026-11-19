import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"

/**
 * A channel: its tag (the word after utm_source=), an optional name shown in
 * the LMS, and whether it is on. Off: hidden from new links; old links still count.
 */
export type Channel = { name: string; label: string | null; active: boolean; seo: boolean }

/** The channels, sorted by name, SEO last — the Owner only. SEO has no link and is always on. */
export async function listChannels(): Promise<ApiResult<Channel[]>> {
  return apiFetch<Channel[]>("/api/channels", { authenticated: true })
}

/**
 * This year's applies per channel and brand, Q1 to Q4 — channel → brand id →
 * [Q1, Q2, Q3, Q4]. Counted like Brands' Applies: forms sent in full, real ones only.
 */
export type ChannelApplies = Record<string, Record<string, number[]>>

export async function listChannelApplies(): Promise<ApiResult<ChannelApplies>> {
  return apiFetch<ChannelApplies>("/api/channels/applies", { authenticated: true })
}

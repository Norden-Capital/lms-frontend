import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { SeoBrand, SeoOverview } from "@/lib/seoTypes"

/**
 * Reading the SEO Overview from the backend, which reads each brand's Google
 * Analytics live. Server-side, because the access token is in a cookie the
 * browser cannot read.
 */

/** The Google robot's email, to add as a Viewer in each brand's GA4. Null when not connected. */
export async function getSeoRobot(): Promise<string | null> {
  const result = await apiFetch<{ email: string | null }>("/api/seo/robot", { authenticated: true })
  return result.ok ? result.data.email : null
}

/** Switched-on brands that have a Google Analytics ID. */
export async function getSeoBrands(): Promise<ApiResult<SeoBrand[]>> {
  return apiFetch<SeoBrand[]>("/api/seo/brands", { authenticated: true })
}

export async function getSeoOverview(
  brandId: string,
  range: string,
  from?: string,
  to?: string
): Promise<ApiResult<SeoOverview>> {
  const params = new URLSearchParams({ brandId, range })
  if (range === "custom") {
    if (from) params.set("from", from)
    if (to) params.set("to", to)
  }
  return apiFetch<SeoOverview>(`/api/seo/overview?${params.toString()}`, { authenticated: true })
}

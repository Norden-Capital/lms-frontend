import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"

/**
 * A brand — added by its website alone. The name and logo are read from the
 * site, and the address is support@{domain}: where its mail arrives, and where
 * answers go out from.
 */
export type Brand = {
  id: string
  name: string
  email: string
  domain: string
  /** Read from the website; null when it declared none. */
  logoUrl: string | null
  /** Switched off: out of the inbox's filter and From list, but kept. */
  active: boolean
  createdAt: string
  /** This year's replies sent from it, Q1 to Q4 — Reply and Reply all only. */
  replies: number[]
}

/** Every brand, by name. The Owner only — the backend refuses anybody else. */
export async function listBrands(): Promise<ApiResult<Brand[]>> {
  return apiFetch<Brand[]>("/api/brands", { authenticated: true })
}

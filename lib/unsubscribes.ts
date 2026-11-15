import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { BrandOption } from "@/lib/applicationTypes"
import { dateRange, unsubscribePageSize, type UnsubscribeRow, type UnsubscribesQuery } from "@/lib/unsubscribeTypes"
import type { Page } from "@/lib/userTypes"

/** The filters the backend takes, from what the URL carries. Shared by the list and the export. */
export function unsubscribeFilters(query: UnsubscribesQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.search) params.set("search", query.search)
  if (query.brand) params.set("brand", query.brand)
  if (query.reason) params.set("reason", query.reason)
  const { from, to } = dateRange(query)
  if (from && to) {
    params.set("from", from)
    params.set("to", to)
  }
  return params
}

/** The order, when one is picked. Shared by the list and the export. */
export function addSort(params: URLSearchParams, sort: string | undefined) {
  if (sort) params.set("sort", sort)
}

/** One page of the list, newest first. */
export async function listUnsubscribes(query: UnsubscribesQuery): Promise<ApiResult<Page<UnsubscribeRow>>> {
  const params = unsubscribeFilters(query)
  addSort(params, query.sort)
  // The URL counts pages from 1, as people do; the API from 0.
  params.set("page", String(Math.max(1, Number(query.page) || 1) - 1))
  params.set("size", String(unsubscribePageSize(query.size)))
  return apiFetch<Page<UnsubscribeRow>>(`/api/unsubscribes?${params}`, { authenticated: true })
}

/** The brands, for the filter. */
export async function listUnsubscribeBrands(): Promise<ApiResult<BrandOption[]>> {
  return apiFetch<BrandOption[]>("/api/unsubscribes/brands", { authenticated: true })
}

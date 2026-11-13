import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import {
  applicationPageSize,
  overviewDays,
  type ApplicationRow,
  type ApplicationsOverview,
  type ApplicationsQuery,
  type BrandOption,
  type ClientDetail,
  type OverviewQuery,
} from "@/lib/applicationTypes"
import type { Page } from "@/lib/userTypes"

/** One page of the Leads, Abandoned or Failed list, newest first. */
export async function listApplications(
  status: "LEAD" | "ABANDONED" | "FAILED",
  query: ApplicationsQuery
): Promise<ApiResult<Page<ApplicationRow>>> {
  const params = new URLSearchParams({ status })
  if (query.search) params.set("search", query.search)
  if (query.brand) params.set("brand", query.brand)
  if (query.channel) params.set("channel", query.channel)
  if (query.sort) params.set("sort", query.sort)
  // The URL counts pages from 1, as people do; the API from 0.
  params.set("page", String(Math.max(1, Number(query.page) || 1) - 1))
  params.set("size", String(applicationPageSize(query.size)))

  return apiFetch<Page<ApplicationRow>>(`/api/applications?${params}`, { authenticated: true })
}

/** The brands, for the filter. */
export async function listApplicationBrands(): Promise<ApiResult<BrandOption[]>> {
  return apiFetch<BrandOption[]>("/api/applications/brands", { authenticated: true })
}

/** The channels, for the filter. */
export async function listApplicationChannels(): Promise<ApiResult<string[]>> {
  return apiFetch<string[]>("/api/applications/channels", { authenticated: true })
}

/** One client, with every time they applied. */
export async function getClient(id: string): Promise<ApiResult<ClientDetail>> {
  return apiFetch<ClientDetail>(`/api/clients/${encodeURIComponent(id)}`, { authenticated: true })
}

/** The numbers for Leads Overview. */
export async function getApplicationsOverview(query: OverviewQuery): Promise<ApiResult<ApplicationsOverview>> {
  const params = new URLSearchParams({ days: String(overviewDays(query.days)) })
  if (query.brand) params.set("brand", query.brand)
  if (query.from && query.to) {
    params.set("from", query.from)
    params.set("to", query.to)
  }

  return apiFetch<ApplicationsOverview>(`/api/applications/overview?${params}`, { authenticated: true })
}

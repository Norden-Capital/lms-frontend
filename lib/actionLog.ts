import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { Page } from "@/lib/userTypes"
import { logPageSize, type ActionLogEntry, type ActionLogQuery } from "@/lib/actionLogTypes"

/** One page of the action log, newest first. The Owner only. */
export async function listActionLog(query: ActionLogQuery): Promise<ApiResult<Page<ActionLogEntry>>> {
  const params = new URLSearchParams()
  if (query.action) params.set("action", query.action)
  if (query.search) params.set("search", query.search)
  if (query.sort) params.set("sort", query.sort)
  // The URL counts pages from 1, as people do; the API from 0.
  const page = Math.max(1, Number(query.page) || 1)
  params.set("page", String(page - 1))
  params.set("size", String(logPageSize(query.size)))

  return apiFetch<Page<ActionLogEntry>>(`/api/action-log?${params}`, { authenticated: true })
}

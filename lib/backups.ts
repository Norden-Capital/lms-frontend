import "server-only"

import { apiFetch, type ApiResult } from "@/lib/api"
import type { BackupLogPage, BackupQuery, BackupStatus } from "@/lib/backupTypes"

/**
 * Where the Backups screen gets its data — the backend's `GET /api/backups`.
 *
 * <p>The same job `lib/system.ts` does for System Health: one place the page
 * asks. Server-only, because the token lives in an httpOnly cookie the browser
 * cannot read.
 *
 * <p>The sort and paging are passed straight through, as the users list does:
 * the table writes them into the address bar and the rows come back already in
 * that order. The backend clamps a page past the end to the last page, and
 * ignores a sort it does not know.
 */
export async function getBackupStatus(
  query: BackupQuery
): Promise<ApiResult<{ status: BackupStatus; log: BackupLogPage }>> {
  const params = new URLSearchParams()
  if (query.sort) params.set("sort", query.sort)
  if (query.page) params.set("page", query.page)
  if (query.size) params.set("size", query.size)

  const suffix = params.size > 0 ? `?${params.toString()}` : ""
  return apiFetch(`/api/backups${suffix}`, { authenticated: true })
}

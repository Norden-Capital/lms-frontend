import "server-only"

import { apiFetch, type ApiError } from "@/lib/api"
import type { InboxOverview, MailMessage, MailPage, MailQuery } from "@/lib/mailTypes"

/**
 * Reading the inbox from the backend, which reads it live from Gmail — one
 * mailbox, set on the server, that every brand forwards into.
 *
 * <p>Server-side because the access token lives in an httpOnly cookie the
 * browser cannot read.
 */

export type Inbox = {
  /** Null when the mailbox could not be read — see `error`. */
  overview: InboxOverview | null
  folderId: string
  page: MailPage
  selected: MailMessage | null
  /** The server has no mailbox set up yet (503). */
  notSetUp: boolean
  error: ApiError | null
}

const EMPTY_PAGE: MailPage = { mails: [], total: 0, page: 1, size: 25, totalPages: 1 }

export async function getInbox(query: MailQuery): Promise<Inbox> {
  const folderId = query.folder || "inbox"
  const list = new URLSearchParams({ folder: folderId, page: query.page || "1" })
  if (query.q) list.set("q", query.q)
  if (query.brand) list.set("brand", query.brand)
  if (query.filter === "unread") list.set("unread", "true")

  // The open message first, so the list and the counts already see it as read.
  const selectedResult = query.mail
    ? await apiFetch<MailMessage>(`/api/inbox/messages/${encodeURIComponent(query.mail)}`, {
        authenticated: true,
      })
    : null

  const [overviewResult, pageResult] = await Promise.all([
    apiFetch<InboxOverview>("/api/inbox", { authenticated: true }),
    apiFetch<MailPage>(`/api/inbox/messages?${list.toString()}`, { authenticated: true }),
  ])

  if (!overviewResult.ok) {
    return {
      overview: null,
      folderId,
      page: EMPTY_PAGE,
      selected: null,
      notSetUp: overviewResult.error.status === 503,
      error: overviewResult.error,
    }
  }

  return {
    overview: overviewResult.data,
    folderId,
    page: pageResult.ok ? pageResult.data : EMPTY_PAGE,
    selected: selectedResult?.ok ? selectedResult.data : null,
    notSetUp: false,
    error: pageResult.ok ? null : pageResult.error,
  }
}

import type { Metadata } from "next"
import { cookies } from "next/headers"
import { Inbox as InboxIcon, MailX } from "lucide-react"

import { PermissionRefused } from "@/components/access/permissionRefused"
import { ErrorState } from "@/components/error/errorState"
import { ComposePane } from "@/components/inbox/composePane"
import { InboxAutoRefresh } from "@/components/inbox/inboxAutoRefresh"
import { InboxLoadingProvider, ReadingPane } from "@/components/inbox/inboxLoading"
import { InboxShell } from "@/components/inbox/inboxShell"
import { MailDisplay } from "@/components/inbox/mailDisplay"
import { MailList } from "@/components/inbox/mailList"
import { requireUser } from "@/lib/auth"
import { PANES_COOKIE, parsePaneLayout } from "@/lib/inboxLayout"
import { getInbox } from "@/lib/mail"
import type { MailAbilities, MailQuery } from "@/lib/mailTypes"

export const metadata: Metadata = {
  title: "Inbox",
}

const READ = "INBOX:READ"

/**
 * The inbox — decided 2026-10-20, the oneBase way: one Gmail mailbox, set on
 * the server, that every brand address forwards into. Read live; nothing to
 * connect or sign in to here.
 *
 * <p>The permission check here only decides what is drawn. The backend checks
 * the same INBOX:* permissions on every call, which is the real boundary.
 */
export default async function InboxPage({
  searchParams,
}: {
  /** The open message, the folder, the filter, the search, the brand and the page. All write here. */
  searchParams: Promise<MailQuery>
}) {
  const user = await requireUser()

  if (!user.permissions.includes(READ)) {
    return <PermissionRefused module="the inbox" permission={READ} />
  }

  const can: MailAbilities = {
    send: user.permissions.includes("INBOX:SEND"),
    delete: user.permissions.includes("INBOX:DELETE"),
    archive: user.permissions.includes("INBOX:ARCHIVE"),
    star: user.permissions.includes("INBOX:STAR"),
  }

  const layout = parsePaneLayout((await cookies()).get(PANES_COOKIE)?.value)
  const query = await searchParams
  const inbox = await getInbox(query)

  if (!inbox.overview) {
    return (
      <ErrorState
        code="INBOX"
        icon={inbox.notSetUp ? MailX : InboxIcon}
        title={inbox.notSetUp ? "Inbox not set up yet" : "Could not load the inbox"}
        description={
          inbox.notSetUp
            ? "Add the Gmail address and App Password in the server settings."
            : (inbox.error?.message ?? "Please try again in a moment.")
        }
        className="min-h-0 flex-1"
        size="sm"
      />
    )
  }

  // Decided once, on the server: every row shows an age, and reading the clock
  // in the browser too would render two different answers.
  const now = new Date()

  return (
    // No padding: a mail client is columns that meet the edges of the window.
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {inbox.error && (
        <p className="shrink-0 border-b bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {inbox.error.message}
        </p>
      )}
      <InboxAutoRefresh />
      <InboxLoadingProvider>
      <InboxShell
        defaultLayout={layout}
        list={
          // Keyed on the query so the search box is re-seeded from the URL when
          // the Back button changes it.
          <MailList
            key={`${query.filter ?? ""}|${query.q ?? ""}|${query.brand ?? ""}`}
            page={inbox.page}
            selectedId={inbox.selected?.id ?? query.mail ?? null}
            query={query}
            overview={inbox.overview}
            folders={inbox.overview.folders}
            folderId={inbox.folderId}
            canStar={can.star}
            canSend={can.send}
            now={now}
          />
        }
        reading={
          <ReadingPane>
          {query.compose === "new" && can.send ? (
            <ComposePane senders={inbox.overview.senders} ownEmail={inbox.overview.email} />
          ) : (
          <MailDisplay
            key={inbox.selected?.id ?? "none"}
            mail={inbox.selected}
            can={can}
            senders={inbox.overview.senders}
            ownEmail={inbox.overview.email}
          />
          )}
          </ReadingPane>
        }
      />
      </InboxLoadingProvider>
    </div>
  )
}

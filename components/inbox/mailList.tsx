"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Paperclip, RotateCw, Search, SquarePen, Star } from "lucide-react"
import { toast } from "sonner"

import { mailAction } from "@/app/(app)/inbox/actions"
import { AccountSwitcher } from "@/components/inbox/accountSwitcher"
import { BrandLabels, LabelLogo } from "@/components/inbox/brandLabels"
import { ListSkeleton, useInboxLoading } from "@/components/inbox/inboxLoading"
import { FolderNav } from "@/components/inbox/folderNav"
import { LoadingCover } from "@/components/ui/loadingCover"
import { TablePagination } from "@/components/ui/tablePagination"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { duration } from "@/lib/format"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type {
  InboxOverview,
  Mail,
  MailFolder,
  MailPage,
  MailQuery,
  MailSender,
} from "@/lib/mailTypes"
import { cn } from "@/lib/utils"

/**
 * Every message, and the one that is open.
 *
 * <p><b>Search, filter and selection live in the URL, not in state.</b> The same
 * decision the user list and the backup log already made, and it buys the same
 * three things: an open message can be linked to, the Back button walks back
 * through what was read, and a reload lands where it left off. The narrowing
 * itself happens on the server — see `lib/mail.ts`.
 *
 * <p>Client-side because of the search box and the writing to the address bar.
 * The rows arrive as a prop from the page, which built them on the server, so no
 * token reaches the browser and the list is in the first paint rather than after
 * a spinner.
 */

/**
 * The "no filter" option needs a value of its own.
 *
 * <p>A Select cannot use an empty string for a choosable item — an empty value
 * is how it says "nothing is selected", so the option would render as blank and
 * the trigger would show nothing. This is a sentinel, translated back to an
 * absent parameter the moment it is chosen, so the address bar never carries it.
 */
const ALL_MAIL = "all"

/** Every brand at once — the backend reads "brands" the same way. */
const ALL_BRANDS = "brands"

function MailList({
  page,
  selectedId,
  query,
  overview,
  folders,
  folderId,
  canStar,
  canSend,
  now,
}: {
  page: MailPage
  /** The mailbox, its brands and its From addresses. */
  overview: InboxOverview
  /** The folders, drawn in this pane's own header. */
  folders: MailFolder[]
  folderId: string
  /** Whether this account holds `INBOX:STAR`. */
  canStar: boolean
  canSend: boolean
  /** The open message, so the row can mark itself. */
  selectedId: string | null
  /** What the address bar currently says. The single source of truth. */
  query: MailQuery
  /**
   * Decided by the caller.
   *
   * <p>Every row shows an age, and an age read from the clock during render
   * gives one answer on the server and a different one a moment later in the
   * browser. React reports that as a mismatch, so the moment is fixed once by
   * the page — the same rule the backup log follows.
   */
  now: Date
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { navigate, loading } = useInboxLoading()

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())

    if (value === null || value === "") next.delete(key)
    else next.set(key, value)

    // Changing the filter or the search can hide the message that is open, and
    // a selection pointing at something no longer listed is how a reading pane
    // ends up showing what the list says is not there. Dropping it lets the
    // server pick the first of whatever survived.
    if (key !== "mail") next.delete("mail")
    if (key !== "compose") next.delete("compose")

    // Opening an email or the writer loads the right pane; anything else, the list.
    navigate(`${pathname}?${next.toString()}`, key === "mail" || key === "compose" ? "mail" : "list")
  }

  /**
   * What is in the search box right now, which is ahead of the URL.
   *
   * <p>Typing has to feel immediate, but each change is a request — so the field
   * keeps its own value and the URL catches up once the typing stops. Without
   * this, "meeting" is seven round trips and the list flickers through six wrong
   * answers on the way to the right one. Copied from the user list, which solved
   * this first.
   */
  const [typed, setTyped] = useState(query.q ?? "")
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const current = query.q ?? ""
    if (typed === current) return

    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setParam("q", typed || null), 350)

    return () => clearTimeout(debounce.current)
    // setParam is rebuilt every render and would restart the timer on each
    // keystroke, which is the one thing this must not do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, query.q])

  const [reloading, startReload] = useTransition()
  const unreadOnly = query.filter === "unread"
  const mails = page.mails
  const brands = overview.brands

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── Which mailbox, and which folder ───────────────────────────────── */}
      {/* This pane's own header, not the application's. The mailbox and the
          folders were briefly put in the app navbar, which was wrong for a
          reason worth keeping: that bar belongs to the whole application, and
          hanging one screen's controls in it makes every other page carry a
          component that knows about mail.

          h-14 matches the reading pane's toolbar exactly, so the two panes share
          one horizontal line across the split rather than each starting at its
          own height. */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <AccountSwitcher email={overview.email} />

        {/* The nav takes what is left and scrolls inside it, rather than the
            switcher and the folders each giving up half. The switcher has one
            right size; the nav is happy at any and can collapse when it is not. */}
        <div className="min-w-0 flex-1">
          <FolderNav folders={folders} selectedId={folderId} />
        </div>

        {/* Back on the header row, where it was before the mailbox and the
            folders arrived and pushed it down to a line of its own. It belongs
            here: it is the last of the three controls that decide what the list
            below contains, and all three should be read in one pass. */}
        <Tabs
          value={unreadOnly ? "unread" : "all"}
          onValueChange={(value) =>
            setParam("filter", value === "unread" ? "unread" : null)
          }
        >
          <TabsList>
            <TabsTrigger value="all">All mail</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* ── Search, the brand it searches within, and what it shows ───────── */}
      {/* No rule under this row. The header above it is chrome and earns its
          border; this is the top of the list itself, and a second line so close
          to the first boxed the search in rather than introducing what follows. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 p-4 pb-2">
        {/* Opens the writing pane on the right, where an email would be. */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon"
                aria-label="New email"
                aria-disabled={!canSend}
                onClick={() => canSend && setParam("compose", "new")}
                className="shrink-0 hover:bg-primary/80"
              />
            }
          >
            <SquarePen />
          </TooltipTrigger>
          <TooltipContent>{canSend ? "New email" : "You need the INBOX:SEND permission."}</TooltipContent>
        </Tooltip>
        <div className="relative min-w-0 flex-1">
          <Search
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Search emails"
            aria-label="Search messages"
            className="pl-9"
          />
        </div>

        {/* All mail, every brand at once, or one brand: mail sent to that
            address. After the search, because both narrow the same list. */}
        <Select
          value={query.brand ?? ALL_MAIL}
          onValueChange={(value) => setParam("brand", value === ALL_MAIL ? null : value)}
        >
          <SelectTrigger className="w-48 shrink-0" aria-label="Brand">
            {/* Without a formatter this renders the raw value. */}
            <SelectValue>
              {(value: string | null) => {
                if (!value || value === ALL_MAIL) return "All mail"
                if (value === ALL_BRANDS) return "All brands"
                const chosen = brands.find((brand) => brand.email === value)
                if (!chosen) return value
                return (
                  <span className="flex min-w-0 items-center gap-2">
                    <LabelLogo src={chosen.logoUrl} />
                    <span className="truncate">{chosen.name}</span>
                  </span>
                )
              }}
            </SelectValue>
          </SelectTrigger>
          {/* min-w-max so a whole name fits; a plain dropdown, not a scrolling popup. */}
          <SelectContent align="end" alignItemWithTrigger={false} className="min-w-max">
            <SelectItem value={ALL_MAIL}>All mail</SelectItem>
            {brands.length > 0 && <SelectItem value={ALL_BRANDS}>All brands</SelectItem>}
            {brands.map((brand) => (
              <SelectItem key={brand.email} value={brand.email} className="pr-8">
                <span className="flex items-center gap-2 whitespace-nowrap">
                  <LabelLogo src={brand.logoUrl} />
                  {brand.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Asks Gmail again — new mail shows without reloading the whole tab. */}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                aria-label="Reload"
                className="shrink-0 bg-card hover:bg-foreground/10"
                onClick={() => startReload(() => router.refresh())}
              />
            }
          >
            <RotateCw className={cn(reloading && "animate-spin")} />
          </TooltipTrigger>
          <TooltipContent>Reload</TooltipContent>
        </Tooltip>
      </div>

      {/* ── The messages ──────────────────────────────────────────────────── */}
      {/* relative: the loader is laid over the messages only, so the search
          box above stays usable while a search loads. */}
      <div className="relative min-h-0 flex-1">
      <LoadingCover show={loading === "list"}>
        <div className="px-4">
          <ListSkeleton />
        </div>
      </LoadingCover>
      <div className={cn("h-full overflow-y-auto px-4 pb-4", THIN_SCROLLBAR)}>
        {mails.length === 0 ? (
          <p className="pt-6 text-center text-sm text-muted-foreground">
            {query.q
              ? `No messages match "${query.q}".`
              : unreadOnly
                ? "Nothing unread."
                : "No messages here."}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {mails.map((mail) => (
              <MailRow
                key={mail.id}
                mail={mail}
                selected={mail.id === selectedId}
                canStar={canStar}
                brands={brands}
                now={now}
                onOpen={() => setParam("mail", mail.id)}
              />
            ))}
          </div>
        )}
      </div>
      </div>

      {/* ── Pages ───────────────────────────────────────────────────────── */}
      {page.total > 0 && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t px-4 py-1.5 text-[0.7rem] text-muted-foreground">
          <p className="tabular-nums">
            {`${(page.page - 1) * page.size + 1}–${(page.page - 1) * page.size + mails.length} of ${page.total}`}
          </p>
          <TablePagination
            page={page.page}
            totalPages={page.totalPages}
            onPage={(next) => setParam("page", String(next))}
          />
        </div>
      )}
    </div>
  )
}

function MailRow({
  mail,
  selected,
  canStar,
  brands,
  now,
  onOpen,
}: {
  mail: Mail
  selected: boolean
  canStar: boolean
  brands: MailSender[]
  now: Date
  onOpen: () => void
}) {
  const age = Math.max(
    0,
    (now.getTime() - new Date(mail.receivedAt).getTime()) / 1000
  )

  /**
   * The star moves; nothing is stored.
   *
   * <p>Local state, like the mute switch on the reading pane. A star that does
   * not fill when clicked reads as broken rather than unbuilt, and there is no
   * mailbox behind this to remember it in.
   */
  // Turned on straight away, and back if Gmail refuses.
  const [starred, setStarred] = useState(mail.starred)
  const [, start] = useTransition()

  function toggleStar() {
    if (!canStar) return
    const next = !starred
    setStarred(next)
    start(async () => {
      const result = await mailAction(mail.id, next ? "star" : "unstar")
      if (!result.ok) {
        setStarred(!next)
        toast.error(result.message ?? "The star could not be changed.")
      }
    })
  }

  return (
    // ⚠️ Not a `<button>` wrapping everything any more, and it cannot be: the
    // star is a control of its own, and a button inside a button is invalid
    // HTML that browsers resolve by dropping one of them.
    //
    // So the row is a box, an absolutely-positioned button fills it to catch the
    // click, and the content sits above with pointer events off — clicks fall
    // through to the button underneath. The star turns them back on for itself.
    <div
      className={cn(
        "relative flex flex-col gap-1 rounded-lg border p-3 transition-colors",
        selected ? "bg-muted" : "hover:bg-muted/50"
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-current={selected ? "true" : undefined}
        // The row has no text of its own once the content stops being inside
        // it, so the label has to carry what it opens.
        aria-label={`${mail.subject}, from ${mail.name}`}
        className="absolute inset-0 rounded-lg"
      />

      <div className="pointer-events-none relative flex w-full items-center gap-2">
        <span className="truncate text-sm font-semibold">{mail.name}</span>

        {/* Blue, and now a real token rather than a hex. Near-black was tried
            and is the wrong call here: every other mark on this row is already
            dark, so an unread dot in the same ink reads as punctuation. Blue is
            the one colour on the row that means nothing else. */}
        {!mail.read && (
          <span
            className="size-2 shrink-0 rounded-full bg-info"
            aria-label="Unread"
          />
        )}

        {/* Pushed to the end rather than floated, so a long sender name truncates
            instead of shoving the age off the row. */}
        {mail.hasAttachments && (
          <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-label="Has attachments" />
        )}

        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
          {duration(age)} ago
        </span>

        <Tooltip>
          <TooltipTrigger
            render={
              <button
                type="button"
                // pointer-events-auto against the wrapper's `none`: this is the
                // one thing in the row that is not part of opening it.
                onClick={toggleStar}
                aria-disabled={!canStar}
                aria-pressed={starred}
                aria-label={starred ? "Starred" : "Not starred"}
                className="pointer-events-auto -m-1 shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
              />
            }
          >
            <Star
              className={cn(
                "size-3.5",
                // Filled when set. An outline that only changes colour is not
                // enough at this size — the shape has to change, or a starred
                // row and an unstarred one look the same at a glance.
                starred && "fill-warning text-warning"
              )}
            />
          </TooltipTrigger>
          <TooltipContent className="block max-w-[16rem] text-left leading-snug">
            {canStar ? (starred ? "Remove star" : "Star this message") : (
              <>
                <p className="font-medium">Star this message</p>
                <p className="mt-0.5 text-background/70">
                  You need the INBOX:STAR permission.
                </p>
              </>
            )}
          </TooltipContent>
        </Tooltip>
      </div>

      <span className="pointer-events-none relative truncate text-xs font-medium">
        {mail.subject}
      </span>

      {/* line-clamp-2, not truncate. A subject fits on one line and a body never
          does — two lines is enough to recognise a message you have already read
          and not so much that the list stops being a list.

          min-h-8 is the other half, and it is about the list rather than the
          message: two lines of `text-xs` are 2rem, so reserving that height
          keeps every row the same size whether its preview runs to one line or
          two. Without it the rows jitter down the column and the labels beneath
          them never line up — which is what turns a list into something you
          have to read rather than scan. */}
      <span className="pointer-events-none relative line-clamp-2 min-h-8 text-xs text-muted-foreground">
        {mail.preview}
      </span>

      {/* The labels are the brands: each with its brand's logo. */}
      <BrandLabels
        labels={mail.labels}
        brand={mail.brand}
        brands={brands}
        className="pointer-events-none relative pt-1"
      />
    </div>
  )
}

export { MailList }

"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Archive,
  ArchiveX,
  Download,
  Forward,
  Inbox,
  LoaderCircle,
  MailOpen,
  MoreVertical,
  Paperclip,
  Reply,
  ReplyAll,
  Star,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { toast } from "sonner"

import { attachmentLink, mailAction } from "@/app/(app)/inbox/actions"
import { BrandLabels } from "@/components/inbox/brandLabels"
import { ComposeForm } from "@/components/inbox/composeForm"
import { useInboxLoading } from "@/components/inbox/inboxLoading"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { bytes, utcStamp } from "@/lib/format"
import { initialsOf } from "@/lib/initials"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type {
  ComposeMode,
  MailAbilities,
  MailMessage,
  MailSender,
} from "@/lib/mailTypes"
import { cn } from "@/lib/utils"

/**
 * One message, open — real since 2026-10-20.
 *
 * <p>Four bands, in the order the eye needs them: what you can do about it,
 * who sent it, what it says, and how to answer. Every action happens in Gmail
 * itself, so it shows there too.
 *
 * <p><b>Every control is gated on a permission</b> — INBOX:SEND, DELETE,
 * ARCHIVE and STAR — and the backend checks the same ones. Disabled, not
 * hidden: a button that is there and says why sends people to ask for the
 * permission rather than wonder where the feature is.
 */

function refusal(permission: string): string {
  return `You need the ${permission} permission.`
}

function ToolbarButton({
  icon: Icon,
  label,
  allowed,
  permission,
  onClick,
  busy,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  allowed: boolean
  permission?: string
  onClick: () => void
  busy?: boolean
  active?: boolean
}) {
  const why = !allowed && permission ? refusal(permission) : null

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="hover:bg-foreground/10"
            // aria-disabled, not disabled: a disabled button gets
            // pointer-events-none, and then its tooltip — the one place that
            // says why — can never open.
            aria-disabled={!allowed || busy}
            aria-label={label}
            aria-pressed={active}
            onClick={() => allowed && !busy && onClick()}
          />
        }
      >
        {busy ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Icon
            className={cn("size-4", active && "fill-warning text-warning")}
          />
        )}
      </TooltipTrigger>
      <TooltipContent className="block max-w-[16rem] text-left leading-snug">
        <p className="font-medium">{label}</p>
        {why && <p className="mt-0.5 text-background/70">{why}</p>}
      </TooltipContent>
    </Tooltip>
  )
}

/**
 * The message as its sender wrote it, in a sandboxed frame.
 *
 * <p>⚠️ Never put into the page itself. The sandbox has no `allow-scripts`, so
 * nothing in the email can run; links open in a new tab; and the content
 * policy keeps it from loading anything but pictures.
 *
 * <p><b>Fit to the pane</b> — decided 2026-10-20. Newsletters are built 600–
 * 800px wide and spill out of a narrow pane, so by default the email is shrunk
 * to fit; the button in the corner switches to its actual size. Only ever
 * shrunk, never blown up. `allow-same-origin` is what lets this page measure
 * the email — safe without `allow-scripts`, since nothing in it can run.
 */
function HtmlBody({ html }: { html: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const [fit, setFit] = useState(true)
  const [scale, setScale] = useState(1)

  // The frame is its own document, so the app's scrollbar (globals.css) does
  // not reach it — the same rules are repeated inside, in the light colours
  // the white email background needs.
  const doc = `<!doctype html><html><head><meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: http: data: cid:; style-src 'unsafe-inline' https:; font-src https: data:">
<base target="_blank">
<style>body{margin:0;padding:16px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;font-size:14px;color:#111;background:#fff;overflow-wrap:anywhere}img{max-width:100%;height:auto}
::-webkit-scrollbar{-webkit-appearance:none;width:8px;height:8px;background:transparent}
::-webkit-scrollbar-track,::-webkit-scrollbar-corner{background:transparent}
::-webkit-scrollbar-track:vertical{border-left:1px solid #e5e5e5}
::-webkit-scrollbar-thumb{border:0;border-radius:0;background-color:rgba(0,0,0,.12);background-clip:padding-box}
::-webkit-scrollbar-button{display:none;width:0;height:0}
@supports not selector(::-webkit-scrollbar){html{scrollbar-color:#e5e5e5 transparent;scrollbar-width:thin}}</style>
</head><body>${html}</body></html>`

  // Measures the email at its own size, then shrinks it to the pane if wider.
  const measure = useCallback(() => {
    const root = frame.current?.contentDocument?.documentElement
    if (!root || !frame.current) return
    root.style.zoom = "1"
    const natural = root.scrollWidth
    const room = frame.current.clientWidth
    const next = fit && natural > room ? room / natural : 1
    root.style.zoom = String(next)
    setScale(next)
  }, [fit])

  useEffect(() => {
    measure()
    const el = frame.current
    if (!el) return
    const observer = new ResizeObserver(() => measure())
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  const shrunk = scale < 0.999

  return (
    <div className="relative h-full w-full">
      <iframe
        ref={frame}
        title="Message"
        srcDoc={doc}
        sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        onLoad={measure}
        className="h-full w-full rounded-md border bg-white"
      />

      {/* Only when there is something to switch: an email that already fits
          looks the same either way. */}
      {(shrunk || !fit) && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-4 bg-card/90 shadow-sm backdrop-blur hover:bg-foreground/10"
                onClick={() => setFit((on) => !on)}
                aria-label={fit ? "Show at actual size" : "Fit to the screen"}
              />
            }
          >
            {fit ? <ZoomIn data-icon="inline-start" /> : <ZoomOut data-icon="inline-start" />}
            {fit ? `${Math.round(scale * 100)}%` : "100%"}
          </TooltipTrigger>
          <TooltipContent>
            {fit ? "Show at full size" : "Fit to the screen"}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}

function MailDisplay({
  mail,
  can,
  senders,
  ownEmail,
}: {
  /** The open message, or null when nothing is selected. */
  mail: MailMessage | null
  can: MailAbilities
  /** Every From address: the mailbox first, then each brand. */
  senders: MailSender[]
  ownEmail: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const { navigate } = useInboxLoading()
  // Hidden until Reply, Reply all or Forward is pressed — decided 2026-10-20.
  const [mode, setMode] = useState<ComposeMode | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [, start] = useTransition()

  if (!mail) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-1">
        <p className="text-sm font-medium">No message selected</p>
        <p className="text-sm text-muted-foreground">
          Pick one from the list.
        </p>
      </div>
    )
  }

  const message = mail

  /** Closes the message — after it has left this folder, or been marked unread. */
  function close() {
    const next = new URLSearchParams(params.toString())
    next.delete("mail")
    navigate(`${pathname}?${next.toString()}`, "mail")
  }

  function act(action: string, done: string, leaves: boolean) {
    setBusy(action)
    start(async () => {
      const result = await mailAction(message.id, action)
      setBusy(null)
      if (!result.ok) {
        toast.error(result.message ?? "Something went wrong. Please try again.")
        return
      }
      toast.success(done)
      if (leaves) close()
      else router.refresh()
    })
  }

  function download(index: number) {
    setBusy(`file-${index}`)
    start(async () => {
      const result = await attachmentLink(message.id, index)
      setBusy(null)
      if (result.ok && result.url) window.location.assign(result.url)
      else toast.error(result.message ?? "The file could not be downloaded.")
    })
  }

  const folder = message.folder
  const inTrash = folder === "trash"

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* ── What you can do about it ──────────────────────────────────────── */}
      <div className="flex h-14 shrink-0 items-center gap-1 border-b px-3">
        {folder === "inbox" && (
          <ToolbarButton
            icon={Archive}
            label="Archive"
            allowed={can.archive}
            permission="INBOX:ARCHIVE"
            busy={busy === "archive"}
            onClick={() => act("archive", "Archived.", true)}
          />
        )}
        {folder !== "inbox" && folder !== "sent" && folder !== "drafts" && (
          <ToolbarButton
            icon={Inbox}
            label="Move to Inbox"
            allowed={can.archive}
            permission="INBOX:ARCHIVE"
            busy={busy === "inbox"}
            onClick={() =>
              act("inbox", "Moved to the Inbox.", folder !== "archive")
            }
          />
        )}
        {folder !== "junk" && folder !== "sent" && folder !== "drafts" && (
          <ToolbarButton
            icon={ArchiveX}
            label="Move to junk"
            allowed={can.archive}
            permission="INBOX:ARCHIVE"
            busy={busy === "junk"}
            onClick={() => act("junk", "Moved to Junk.", true)}
          />
        )}
        <ToolbarButton
          icon={Trash2}
          label={inTrash ? "Delete forever" : "Delete"}
          allowed={can.delete}
          permission="INBOX:DELETE"
          busy={busy === "delete"}
          onClick={() =>
            act(
              "delete",
              inTrash ? "Deleted for good." : "Moved to Trash.",
              true,
            )
          }
        />

        <Separator
          orientation="vertical"
          className="mx-1.5 data-vertical:h-5 data-vertical:self-center"
        />

        <ToolbarButton
          icon={Star}
          label={message.starred ? "Remove star" : "Star"}
          allowed={can.star}
          permission="INBOX:STAR"
          active={message.starred}
          busy={busy === "star" || busy === "unstar"}
          onClick={() =>
            act(
              message.starred ? "unstar" : "star",
              message.starred ? "Star removed." : "Starred.",
              false,
            )
          }
        />

        <div className="ml-auto flex items-center gap-1">
          <ToolbarButton
            icon={Reply}
            label="Reply"
            allowed={can.send}
            permission="INBOX:SEND"
            onClick={() => setMode("reply")}
          />
          <ToolbarButton
            icon={ReplyAll}
            label="Reply all"
            allowed={can.send}
            permission="INBOX:SEND"
            onClick={() => setMode("replyAll")}
          />
          <ToolbarButton
            icon={Forward}
            label="Forward"
            allowed={can.send}
            permission="INBOX:SEND"
            onClick={() => setMode("forward")}
          />

          <Separator
            orientation="vertical"
            className="mx-1.5 data-vertical:h-5 data-vertical:self-center"
          />

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="More"
                        className="text-muted-foreground hover:bg-foreground/10"
                      />
                    }
                  />
                }
              >
                <MoreVertical className="size-4" />
              </TooltipTrigger>
              <TooltipContent>More</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem
                onClick={() => act("unread", "Marked as unread.", true)}
              >
                <MailOpen data-icon="inline-start" />
                Mark as unread
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Back to "No message selected". */}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Close"
                  className="text-muted-foreground hover:bg-foreground/10"
                  onClick={close}
                />
              }
            >
              <X className="size-4" />
            </TooltipTrigger>
            <TooltipContent>Close</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* ── Who sent it ───────────────────────────────────────────────────── */}
      <div className="flex shrink-0 items-start gap-4 border-b p-4">
        {/* The same rounded square as on a user's details page. */}
        <Avatar className="size-12 rounded-xl after:rounded-xl">
          <AvatarFallback className="rounded-xl text-sm font-medium">
            {initialsOf(...splitName(message.name))}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate text-sm font-semibold">
            {message.name}{" "}
            <span className="font-normal text-muted-foreground">
              &lt;{message.email}&gt;
            </span>
          </p>
          <p className="truncate text-xs font-medium">{message.subject}</p>
          {message.to.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">To:</span>{" "}
              {message.to.join(", ")}
            </p>
          )}
          {message.cc.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Cc:</span>{" "}
              {message.cc.join(", ")}
            </p>
          )}
        </div>

        {/* The time, and under it the brand and labels — decided 2026-10-20. */}
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <p className="font-mono text-xs whitespace-nowrap text-muted-foreground">
            {utcStamp(message.receivedAt)} UTC
          </p>
          <BrandLabels
            labels={message.labels}
            brand={message.brand}
            brands={senders}
            className="max-w-56 justify-end"
          />
        </div>
      </div>

      {/* ── What it says ──────────────────────────────────────────────────── */}
      {/* An HTML email scrolls inside its own frame, so this area only scrolls
          for plain text — otherwise opening the reply box, which makes the
          area shorter, added a second scrollbar around the first. */}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-3 p-4",
          message.html ? "overflow-hidden" : "overflow-y-auto",
          THIN_SCROLLBAR,
        )}
      >
        {message.html ? (
          <div className="min-h-0 flex-1">
            <HtmlBody html={message.html} />
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{message.text}</p>
        )}

        {message.attachments.length > 0 && (
          <ul className="flex shrink-0 flex-wrap gap-2">
            {message.attachments.map((file) => (
              <li key={file.index}>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        onClick={() => download(file.index)}
                        className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-xs transition-colors hover:bg-foreground/10"
                      />
                    }
                  >
                    <Paperclip
                      className="size-3.5 text-muted-foreground"
                      aria-hidden
                    />
                    <span className="max-w-56 truncate font-medium">
                      {file.name}
                    </span>
                    {file.size > 0 && (
                      <span className="text-muted-foreground">
                        {bytes(file.size)}
                      </span>
                    )}
                    {busy === `file-${file.index}` ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Download
                        className="size-3.5 text-muted-foreground"
                        aria-hidden
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>Download {file.name}</TooltipContent>
                </Tooltip>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── How to answer ─────────────────────────────────────────────────── */}
      {can.send && mode && (
        <>
          <Separator className="shrink-0" />
          <div className="shrink-0 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                {mode === "reply"
                  ? "Reply"
                  : mode === "replyAll"
                    ? "Reply all"
                    : "Forward"}
              </p>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hover:bg-foreground/10"
                      aria-label="Close"
                      onClick={() => setMode(null)}
                    />
                  }
                >
                  <X className="size-4" />
                </TooltipTrigger>
                <TooltipContent>Close without sending</TooltipContent>
              </Tooltip>
            </div>
            {/* Keyed on the message and the mode, so switching starts afresh. */}
            <ComposeForm
              key={`${message.id}|${mode}`}
              senders={senders}
              ownEmail={ownEmail}
              mode={mode}
              original={message}
              compact
              onDone={() => setMode(null)}
            />
          </div>
        </>
      )}
    </div>
  )
}

/**
 * "William Smith" -> ["William", "Smith"]. Mail carries one display name, so
 * everything after the first word is treated as the surname.
 */
function splitName(name: string): [string, string] {
  const [first = "", ...rest] = name.trim().split(/\s+/)
  return [first, rest.join(" ")]
}

export { MailDisplay }

"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Paperclip, SendHorizontal, X } from "lucide-react"
import { toast } from "sonner"

import { refreshInbox, sendLink } from "@/app/(app)/inbox/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { bytes } from "@/lib/format"
import type { ComposeMode, MailMessage, MailSender } from "@/lib/mailTypes"
import { cn } from "@/lib/utils"

/**
 * Writing an email — new, a reply, a reply to all, or a forward. One form for
 * all four, so they cannot drift apart.
 *
 * <p>Sent from the browser straight to the backend with a two-minute pass,
 * because the website's own server refuses uploads over 4.5 MB and Gmail
 * allows 25. Gmail keeps a copy in Sent by itself.
 */

/** Gmail's limit for everything attached to one email. */
const MAX_TOTAL = 25 * 1024 * 1024

function prefixed(prefix: string, subject: string) {
  return subject.toLowerCase().startsWith(prefix.toLowerCase()) ? subject : `${prefix} ${subject}`
}

/** Everyone in a list except our own addresses — you do not reply to yourself. */
function others(list: string[], own: string[]) {
  return list.filter((entry) => !own.some((address) => entry.toLowerCase().includes(address.toLowerCase())))
}

/** Who a reply, a reply to all or a forward starts out addressed to. */
function initial(mode: ComposeMode, original: MailMessage | null, own: string[]) {
  if (!original || mode === "new") return { to: "", cc: "", subject: "" }
  const sender = original.replyTo ?? original.email

  if (mode === "forward") return { to: "", cc: "", subject: prefixed("Fwd:", original.subject) }
  if (mode === "reply") return { to: sender, cc: "", subject: prefixed("Re:", original.subject) }

  return {
    to: [sender, ...others(original.to, own)].filter(Boolean).join(", "),
    cc: others(original.cc, own).join(", "),
    subject: prefixed("Re:", original.subject),
  }
}

function ComposeForm({
  senders,
  ownEmail,
  mode,
  original,
  compact = false,
  onDone,
}: {
  /** Every From address: the mailbox first, then each brand. */
  senders: MailSender[]
  /** This mailbox's own address — left out when replying to all. */
  ownEmail: string
  mode: ComposeMode
  original: MailMessage | null
  /** Under an open message: no subject line, a shorter box. */
  compact?: boolean
  onDone?: () => void
}) {
  const router = useRouter()
  const start = initial(mode, original, [ownEmail, ...senders.map((sender) => sender.email)])

  // An answer goes out from the brand the email came to; anything else from
  // the mailbox itself. Brand addresses are left out of "reply all" too.
  const [from, setFrom] = useState(
    (original && senders.find((sender) => sender.email === original.brand)?.email) ?? senders[0]?.email ?? ""
  )

  const [to, setTo] = useState(start.to)
  const [cc, setCc] = useState(start.cc)
  const [showCc, setShowCc] = useState(start.cc !== "")
  const [subject, setSubject] = useState(start.subject)
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [sending, setSending] = useState<"send" | "draft" | null>(null)
  const picker = useRef<HTMLInputElement>(null)

  const total = files.reduce((sum, file) => sum + file.size, 0)
  const tooBig = total > MAX_TOTAL

  function addFiles(list: FileList | null) {
    if (!list) return
    setFiles((current) => [...current, ...Array.from(list)])
    if (picker.current) picker.current.value = ""
  }

  function submit(draft: boolean) {
    setError(null)
    if (!draft && to.trim() === "") {
      setError("Add at least one email address.")
      return
    }
    if (tooBig) {
      setError("Files are too big. The limit is 25 MB.")
      return
    }

    setSending(draft ? "draft" : "send")
    startTransition(async () => {
      const pass = await sendLink()
      if (!pass.ok || !pass.url) {
        setError(pass.message ?? "The email could not be sent.")
        setSending(null)
        return
      }

      const form = new FormData()
      form.set("from", from)
      form.set("to", to)
      form.set("cc", showCc ? cc : "")
      form.set("subject", subject)
      form.set("body", body)
      form.set("mode", mode)
      if (original && mode !== "new") form.set("original", original.id)
      form.set("draft", String(draft))
      files.forEach((file) => form.append("files", file))

      let response: Response
      try {
        response = await fetch(pass.url, { method: "POST", body: form })
      } catch {
        setError("Could not connect. Please try again.")
        setSending(null)
        return
      }

      if (!response.ok) {
        const reason = await response.json().catch(() => null)
        setError(reason?.message ?? "The email could not be sent.")
        setSending(null)
        return
      }

      toast.success(draft ? "Saved to Drafts." : "Email sent.")
      setBody("")
      setFiles([])
      setSending(null)
      await refreshInbox()
      router.refresh()
      onDone?.()
    })
  }

  return (
    // A new email fills the pane: who it is for at the top, the message and
    // the buttons at the bottom. A reply under an email stays compact.
    <div className={cn("flex flex-col gap-2", !compact && "h-full")}>
      {senders.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-xs text-muted-foreground">From</span>
          <Select value={from} onValueChange={(value) => value && setFrom(value)}>
            <SelectTrigger className="h-8 w-full" aria-label="From">
              <SelectValue>
                {(value: string | null) => {
                  const sender = senders.find((entry) => entry.email === value)
                  return sender ? `${sender.name} <${sender.email}>` : "Choose an address"
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="start" alignItemWithTrigger={false}>
              {senders.map((sender) => (
                <SelectItem key={sender.email} value={sender.email}>
                  {sender.name} &lt;{sender.email}&gt;
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="w-10 shrink-0 text-xs text-muted-foreground" htmlFor={`to-${mode}`}>
          To
        </label>
        <Input
          id={`to-${mode}`}
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="name@example.com, another@example.com"
          className="h-8"
        />
        {!showCc && (
          <button
            type="button"
            onClick={() => setShowCc(true)}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
          >
            Cc
          </button>
        )}
      </div>

      {showCc && (
        <div className="flex items-center gap-2">
          <label className="w-10 shrink-0 text-xs text-muted-foreground" htmlFor={`cc-${mode}`}>
            Cc
          </label>
          <Input
            id={`cc-${mode}`}
            value={cc}
            onChange={(event) => setCc(event.target.value)}
            className="h-8"
          />
        </div>
      )}

      {!compact && (
        <div className="flex items-center gap-2">
          <label className="w-10 shrink-0 text-xs text-muted-foreground" htmlFor={`subject-${mode}`}>
            Subject
          </label>
          <Input
            id={`subject-${mode}`}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="h-8"
          />
        </div>
      )}

      {/* In a new email the message box takes all the space that is left. */}
      <div className={cn("flex flex-col gap-2", !compact && "min-h-0 flex-1 pt-2")}>
      <Textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={
          mode === "forward" ? "Add a message (optional)…" : mode === "new" ? "Write your email…" : "Write your reply…"
        }
        className={cn("p-3", compact ? "min-h-24" : "min-h-48 flex-1 resize-none")}
        aria-label="Message"
      />

      {/* The files going with it. A forward carries the original's own as well. */}
      {(files.length > 0 || (mode === "forward" && (original?.attachments.length ?? 0) > 0)) && (
        <ul className="flex flex-wrap gap-1.5">
          {mode === "forward" && (original?.attachments.length ?? 0) > 0 && (
            <li className="rounded-md border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
              + the original&apos;s {original!.attachments.length}{" "}
              {original!.attachments.length === 1 ? "file" : "files"}
            </li>
          )}
          {files.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 rounded-md border bg-muted/40 py-1 pr-1 pl-2 text-xs"
            >
              <Paperclip className="size-3 text-muted-foreground" aria-hidden />
              <span className="max-w-48 truncate">{file.name}</span>
              <span className="text-muted-foreground">{bytes(file.size)}</span>
              <button
                type="button"
                onClick={() => setFiles((current) => current.filter((_, i) => i !== index))}
                className="rounded-sm p-0.5 text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={picker}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="hover:bg-foreground/10"
                onClick={() => picker.current?.click()}
                disabled={pending}
              />
            }
          >
            <Paperclip data-icon="inline-start" />
            Attach
          </TooltipTrigger>
          <TooltipContent>Attach files (25 MB max)</TooltipContent>
        </Tooltip>
        {files.length > 0 && (
          <span className={cn("text-xs", tooBig ? "text-destructive" : "text-muted-foreground")}>
            {bytes(total)} of 25 MB
          </span>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="ml-auto hover:bg-foreground/10"
                onClick={() => submit(true)}
                disabled={pending}
              />
            }
          >
            {sending === "draft" ? "Saving…" : "Save draft"}
          </TooltipTrigger>
          <TooltipContent>Save it and finish later</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                size="sm"
                className="hover:bg-primary/80"
                onClick={() => submit(false)}
                disabled={pending}
              />
            }
          >
            <SendHorizontal data-icon="inline-start" />
            {sending === "send" ? "Sending…" : "Send"}
          </TooltipTrigger>
          <TooltipContent>Send now</TooltipContent>
        </Tooltip>
      </div>
      </div>
    </div>
  )
}

export { ComposeForm }

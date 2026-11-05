"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronRight, Copy, CopyCheck, Globe, LoaderCircle, Megaphone, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { addChannel, removeChannel } from "@/app/(app)/configuration/channels/actions"
import { Panel } from "@/components/system/panel"
import { DialogHead, Refusal } from "@/components/users/userActionDialogs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { BrandLogo } from "@/components/ui/brandLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { channelLabel } from "@/lib/applicationTypes"
import type { Brand } from "@/lib/brands"
import { cn } from "@/lib/utils"

/**
 * Channels — decided 2026-11-02. A channel is the word after utm_source=, and
 * its link goes straight to the brand's apply form. Built here, so every link
 * is written the same way. SEO has no link: no tag already means SEO.
 *
 * Laid out as a list and its detail — redesigned 2026-11-04. Showing every
 * brand's link for every channel at once was a wall of addresses; now one
 * channel is open at a time, with one line per brand.
 */

const SEO = "seo"

/** https://apply.365loan.ca/?utm_source=email */
function linkFor(brand: Brand, channel: string) {
  return `https://apply.${brand.domain}/?utm_source=${channel}`
}

/** Copies, and says so. Clipboard access can be refused, so that is said too. */
function copyText(text: string, done: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.success(done))
    .catch(() => toast.error("Could not copy. Select it instead."))
}

function ChannelsPanel({ channels, brands }: { channels: string[]; brands: Brand[] }) {
  const sorted = [...channels].sort((a, b) => channelLabel(a).localeCompare(channelLabel(b)))
  const [picked, setPicked] = useState<string>(sorted[0] ?? SEO)
  const [removing, setRemoving] = useState<string | null>(null)
  // A channel removed or renamed elsewhere falls back to the first one.
  const current = picked === SEO || sorted.includes(picked) ? picked : (sorted[0] ?? SEO)

  return (
    <div className="grid min-h-0 gap-4 md:grid-cols-[17rem_minmax(0,1fr)]">
      <Panel
        title="Channels"
        hint={<>Add a channel, then share its link. Leads from that link get the channel.</>}
        action={<span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">{sorted.length + 1}</span>}
        bodyClassName="gap-3 p-3"
      >
        <AddChannel onAdded={setPicked} />

        <ul className="flex flex-col gap-0.5" aria-label="Channels">
          <ChannelItem name={SEO} note="No link" active={current === SEO} onPick={setPicked} />
          {sorted.map((channel) => (
            <ChannelItem
              key={channel}
              name={channel}
              note={`${brands.length} ${brands.length === 1 ? "link" : "links"}`}
              active={current === channel}
              onPick={setPicked}
            />
          ))}
        </ul>

        {sorted.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-4 text-center text-xs text-muted-foreground">
            No channels yet. Add one above, like facebook or email.
          </p>
        ) : null}
      </Panel>

      {current === SEO ? (
        <SeoDetail />
      ) : (
        <ChannelDetail channel={current} brands={brands} onRemove={() => setRemoving(current)} />
      )}

      {removing && <RemoveDialog channel={removing} onClose={() => setRemoving(null)} />}
    </div>
  )
}

/** One line in the list. A button, so it works by keyboard. */
function ChannelItem({
  name,
  note,
  active,
  onPick,
}: {
  name: string
  note: string
  active: boolean
  onPick: (name: string) => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(name)}
        aria-current={active ? "true" : undefined}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
          active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-md border bg-card",
            active && "border-foreground/20"
          )}
        >
          {name === SEO ? <Globe className="size-3.5" aria-hidden /> : <Megaphone className="size-3.5" aria-hidden />}
        </span>
        <span className="min-w-0 flex-1 truncate">{channelLabel(name)}</span>
        <span className="shrink-0 text-[0.7rem] text-muted-foreground">{note}</span>
        <ChevronRight className={cn("size-3.5 shrink-0", active ? "opacity-60" : "opacity-0")} aria-hidden />
      </button>
    </li>
  )
}

/** SEO is the default, not something to share — so it explains itself instead. */
function SeoDetail() {
  return (
    <Panel title="SEO" bodyClassName="items-center justify-center gap-2 p-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Globe className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <p className="text-sm font-medium">No link needed</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        People who come from your brand sites, or from any link with no tag, count as SEO.
      </p>
    </Panel>
  )
}

/** The open channel: its tag, then one line per brand with a copy button. */
function ChannelDetail({ channel, brands, onRemove }: { channel: string; brands: Brand[]; onRemove: () => void }) {
  return (
    <Panel
      title={channelLabel(channel)}
      action={
        <div className="flex items-center gap-1.5">
          {brands.length > 1 ? (
            <Button
              variant="outline"
              size="sm"
              className="bg-card"
              onClick={() =>
                copyText(
                  brands.map((brand) => `${brand.name}: ${linkFor(brand, channel)}`).join("\n"),
                  `${brands.length} links copied.`
                )
              }
            >
              <CopyCheck data-icon="inline-start" />
              Copy all links
            </Button>
          ) : null}
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="bg-card text-muted-foreground hover:text-destructive"
                  onClick={onRemove}
                  aria-label={`Remove ${channelLabel(channel)}`}
                />
              }
            >
              <Trash2 />
            </TooltipTrigger>
            <TooltipContent>Remove this channel</TooltipContent>
          </Tooltip>
        </div>
      }
      bodyClassName="gap-4 p-4"
    >
      <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        Leads get this channel when their link ends with
        <code className="rounded-sm border bg-muted px-1.5 py-0.5 font-mono text-[0.7rem] text-foreground">
          ?utm_source={channel}
        </code>
      </p>

      {brands.length === 0 ? (
        <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
          Add a brand first. Each brand gets its own link.
        </p>
      ) : (
        <ul className="flex flex-col divide-y rounded-md border">
          {brands.map((brand) => (
            <LinkLine key={brand.id} brand={brand} link={linkFor(brand, channel)} />
          ))}
        </ul>
      )}
    </Panel>
  )
}

/** One brand's link: who it is for, the address, and a copy button that shows it worked. */
function LinkLine({ brand, link }: { brand: Brand; link: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => toast.error("Could not copy. Select it instead."))
  }

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:flex-nowrap">
      <div className="flex min-w-0 items-center gap-2.5 sm:w-52 sm:shrink-0">
        <BrandLogo name={brand.name} logoUrl={brand.logoUrl} className="size-6" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{brand.name}</p>
          <p className="truncate text-[0.7rem] text-muted-foreground">{brand.domain}</p>
        </div>
      </div>
      <code
        className="min-w-0 flex-1 truncate rounded-sm bg-muted/60 px-2 py-1 font-mono text-xs select-all"
        title={link}
      >
        {link.replace("https://", "")}
      </code>
      <Button
        variant="outline"
        size="sm"
        className={cn("w-20 shrink-0 bg-card", copied && "text-success")}
        onClick={copy}
        aria-label={`Copy the ${brand.name} link`}
      >
        {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </li>
  )
}

/** One input and a button — the channel's name is all there is to type. */
function AddChannel({ onAdded }: { onAdded: (name: string) => void }) {
  const router = useRouter()
  const [name, setName] = useState("")
  const [pending, start] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    const channel = name.trim().toLowerCase()
    if (!channel || pending) return
    start(async () => {
      const result = await addChannel(channel)
      if (!result.ok) {
        toast.error(result.message ?? "The channel could not be added.")
        return
      }
      toast.success("Channel added.")
      setName("")
      onAdded(channel)
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative min-w-0 flex-1">
        <Megaphone
          className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New channel, e.g. facebook"
          aria-label="Channel name"
          className="h-8 w-full bg-card pl-8"
          disabled={pending}
        />
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="submit"
              size="icon-sm"
              className="hover:bg-primary/80"
              aria-label="Add channel"
              aria-disabled={pending || !name.trim()}
            />
          }
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
        </TooltipTrigger>
        <TooltipContent>{pending ? "Adding…" : "Add channel"}</TooltipContent>
      </Tooltip>
    </form>
  )
}

function RemoveDialog({ channel, onClose }: { channel: string; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | undefined>()

  return (
    <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent size="sm">
        <DialogHead icon={Trash2} tone="bg-destructive/10 text-destructive" title="Remove channel?">
          {channelLabel(channel)} leaves this list. Its leads keep their channel, and its links still work.
        </DialogHead>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await removeChannel(channel)
                if (!result.ok) {
                  setError(result.message ?? "Something went wrong. Please try again.")
                  return
                }
                toast.success("Channel removed.")
                onClose()
                router.refresh()
              })
            }
          >
            {pending ? "Removing…" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ChannelsPanel }

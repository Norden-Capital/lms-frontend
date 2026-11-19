"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Globe, LoaderCircle, Lock, Megaphone, Pencil, Plus } from "lucide-react"
import { toast } from "sonner"

import { useHolds } from "@/components/access/heldPermissions"
import { addChannel, updateChannel } from "@/app/(app)/configuration/channels/actions"
import { Refusal } from "@/components/users/userActionDialogs"
import { Panel } from "@/components/system/panel"
import { QuarterSparkline } from "@/components/charts/quarterSparkline"
import { BrandLogo } from "@/components/ui/brandLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageFooter, usePage } from "@/components/ui/pageFooter"
import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { channelLabel, sharedSites, siteOf, tldOf } from "@/lib/applicationTypes"
import type { Brand } from "@/lib/brands"
import type { Channel, ChannelApplies } from "@/lib/channels"
import { cn } from "@/lib/utils"

/**
 * Channels — decided 2026-11-02. A channel is the word after utm_source=, and
 * its link goes straight to the brand's apply form. Built here, so every link
 * is written the same way. SEO has no link: no tag already means SEO.
 *
 * Redone 2026-11-09 to match Brands: one card, the channels as tabs in its
 * heading beside the add box, and the open channel's links as a table.
 */

/** Shown if the server's list has no SEO row. */
const SEO: Channel = { name: "seo", label: "SEO", active: true, seo: true }

/** Brand links on one page of a channel. */
const PAGE_SIZE = 10

// Sticky, so the titles stay on top while the rows scroll under them.
const HEAD =
  "sticky top-0 z-10 bg-card py-2 shadow-[inset_0_-1px_0_var(--border)] text-left font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

/** https://apply.365loan.ca/?utm_source=email */
function linkFor(brand: Brand, channel: string) {
  return `https://apply.${brand.domain}/?utm_source=${channel}`
}

/** The name shown in the LMS: its label, or else the tag with a capital ("Facebook"). */
function nameOf(channel: Channel) {
  return channel.label?.trim() || channelLabel(channel.name)
}

/** Four quarters, even when the server has none for this brand. */
function quarters(values: number[] | undefined): number[] {
  return [0, 1, 2, 3].map((index) => values?.[index] ?? 0)
}

function sum(values: number[] | undefined): number {
  return quarters(values).reduce((total, value) => total + value, 0)
}

/** The longest label. */
const LABEL_MAX = 60

/** The small "Off" tag beside an off channel's name. */
const OFF_TAG =
  "rounded-sm border px-1 font-mono text-[0.6rem] font-normal tracking-wide text-muted-foreground uppercase"

/** Off: hidden from new links. Old links still count. */
const OFF_TEXT = "Off: hidden from new links. Visits from old links still count."

function ChannelsPanel({
  channels,
  brands,
  applies,
}: {
  channels: Channel[]
  brands: Brand[]
  applies: ChannelApplies
}) {
  const canAdd = useHolds("CHANNEL_SETUP:CREATE")
  // The channels by name, then SEO last.
  const seo = channels.find((channel) => channel.seo) ?? SEO
  const sorted = channels.filter((channel) => !channel.seo).sort((a, b) => nameOf(a).localeCompare(nameOf(b)))
  const tabs = [...sorted, seo]
  const [picked, setPicked] = useState<string>(tabs[0].name)
  const [editing, setEditing] = useState<Channel | null>(null)
  // A channel gone elsewhere falls back to the first one.
  const shownChannel = tabs.find((channel) => channel.name === picked) ?? tabs[0]
  const current = shownChannel.name
  const counts = applies[current] ?? {}

  // The open channel's rows: sorted, then one page at a time.
  const { sorted: rows, head } = useSort(brands, {
    brand: (brand: Brand) => brand.name,
    applies: (brand: Brand) => sum(counts[brand.id]),
  })
  const [wanted, setPage] = useState(1)
  const { page, rows: shown } = usePage(rows, PAGE_SIZE, wanted)
  // The ending shows only when two brands share a site, as on the Leads list.
  const shared = sharedSites(brands)

  function openTab(channel: string) {
    setPicked(channel)
    setPage(1)
  }

  return (
    <Tabs value={current} onValueChange={(value) => openTab(String(value))} className="flex min-h-0 flex-1 flex-col">
      <Panel
        title="Channels"
        hint={<>Add a channel, then share its link. Leads from that link get the channel.</>}
        action={
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-1 sm:flex-nowrap sm:gap-3">
            {/* Scrolls sideways when there are many channels. */}
            <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden sm:w-auto">
              <TabsList>
                {tabs.map((channel) => (
                  <TabsTrigger key={channel.name} value={channel.name} className="px-2.5">
                    <span className={cn("inline-flex items-center gap-1.5", !channel.active && "opacity-55")}>
                      {channel.seo ? <Globe className="size-3.5" /> : <Megaphone className="size-3.5" />}
                      {nameOf(channel)}
                    </span>
                    {channel.active ? null : <span className={OFF_TAG}>Off</span>}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {canAdd && <AddChannel onAdded={openTab} />}
          </div>
        }
        // Fills the page down to the warning; the table scrolls inside.
        className="flex-1"
        bodyClassName="p-0 overflow-auto"
        // Always there, so you can go page by page.
        footer={
          brands.length > 0 ? (
            <PageFooter page={page} pageSize={PAGE_SIZE} total={brands.length} onPage={setPage} />
          ) : null
        }
      >
        <ChannelBar channel={shownChannel} onEdit={() => setEditing(shownChannel)} />
        <ChannelLinks
          channel={shownChannel}
          off={!shownChannel.active}
          rows={shown}
          shared={shared}
          applies={counts}
          head={head}
        />
      </Panel>
      <EditSheet channel={editing} onClose={() => setEditing(null)} />
    </Tabs>
  )
}

/**
 * The strip on top of the open channel (design: LMS/design/channels-edit-toggle):
 * its tag, the on/off switch and Edit. No Delete. SEO has no tag and is always on.
 */
function ChannelBar({ channel, onEdit }: { channel: Channel; onEdit: () => void }) {
  const router = useRouter()
  const canEdit = useHolds("CHANNEL_SETUP:UPDATE")
  const [pending, start] = useTransition()
  const on = channel.active

  function toggle(next: boolean) {
    if (channel.seo || pending) return
    start(async () => {
      const result = await updateChannel(channel.name, { active: next })
      if (!result.ok) {
        toast.error(result.message ?? "The channel could not be changed.")
        return
      }
      toast.success(next ? "Channel on." : "Channel off.")
      router.refresh()
    })
  }

  return (
    <div className={cn("flex items-center justify-between gap-3 border-b px-4 py-2", !on && "bg-muted/40")}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className={cn("font-medium", !on && "text-muted-foreground")}>{nameOf(channel)}</span>
        {!channel.seo ? (
          <code className="rounded-sm bg-muted/60 px-1.5 py-0.5 font-mono text-[0.7rem] text-muted-foreground">
            utm_source={channel.name}
          </code>
        ) : (
          <>
            <span className="text-muted-foreground">—</span>
            <span className="text-xs text-muted-foreground">No tag. Visits with no tag count here.</span>
          </>
        )}
        {on ? null : <span className="text-xs text-muted-foreground">{OFF_TEXT}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {!channel.seo ? (
          <label
            className={cn(
              "flex items-center gap-2 text-xs",
              on ? "text-foreground" : "text-muted-foreground",
              canEdit && !pending ? "cursor-pointer" : "cursor-not-allowed",
            )}
          >
            <Switch size="sm" checked={on} disabled={!canEdit || pending} onCheckedChange={toggle} />
            {on ? "Active" : "Off"}
          </label>
        ) : (
          <Tooltip>
            <TooltipTrigger
              render={
                <span
                  tabIndex={0}
                  className="flex cursor-not-allowed items-center gap-2 text-xs text-muted-foreground"
                />
              }
            >
              <Switch size="sm" checked disabled />
              <Lock className="size-3" aria-hidden />
              Always on
            </TooltipTrigger>
            <TooltipContent>SEO is always on. It counts visits with no tag.</TooltipContent>
          </Tooltip>
        )}
        {canEdit ? (
          <>
            <span className="h-4 w-px bg-border" aria-hidden />
            {channel.seo ? (
              <Tooltip>
                <TooltipTrigger render={<span tabIndex={0} />}>
                  <Button variant="outline" size="sm" className="bg-card" disabled>
                    <Pencil data-icon="inline-start" className="size-3.5" />
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>SEO can&apos;t be changed.</TooltipContent>
              </Tooltip>
            ) : (
              <Button variant="outline" size="sm" className="bg-card" onClick={onEdit}>
                <Pencil data-icon="inline-start" className="size-3.5" />
                Edit
              </Button>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}

/**
 * Edit, in a sheet from the right like the users page (owner, 2026-11-19):
 * the name shown in the LMS and on/off. The tag is shown, locked: it is in the
 * links. SEO is never edited. Sends only what changed.
 */
function EditSheet({ channel, onClose }: { channel: Channel | null; onClose: () => void }) {
  // A new form each time it opens, so it starts from the saved values.
  const [visit, setVisit] = useState(0)
  const [shown, setShown] = useState<Channel | null>(channel)
  if (channel && channel !== shown) {
    setShown(channel)
    setVisit((v) => v + 1)
  }

  return (
    <Sheet open={channel !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right">
        <SheetHeader className="pr-12">
          <SheetTitle>Edit channel</SheetTitle>
          <SheetDescription>Change the name shown in the LMS, or switch it off.</SheetDescription>
        </SheetHeader>
        {shown ? <EditForm key={visit} channel={shown} onDone={onClose} /> : null}
      </SheetContent>
    </Sheet>
  )
}

function EditForm({ channel, onDone }: { channel: Channel; onDone: () => void }) {
  const router = useRouter()
  const [label, setLabel] = useState(channel.label ?? "")
  const [active, setActive] = useState(channel.active)
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | undefined>()

  function save(event: React.FormEvent) {
    event.preventDefault()
    if (pending) return
    const changes: { label?: string | null; active?: boolean } = {}
    const nextLabel = label.trim() || null
    if (nextLabel !== (channel.label?.trim() || null)) changes.label = nextLabel
    if (active !== channel.active) changes.active = active
    if (Object.keys(changes).length === 0) {
      onDone()
      return
    }
    start(async () => {
      const result = await updateChannel(channel.name, changes)
      if (!result.ok) {
        setError(result.message ?? "Something went wrong. Please try again.")
        return
      }
      toast.success("Channel saved.")
      onDone()
      router.refresh()
    })
  }

  return (
    <form onSubmit={save} className="flex flex-1 flex-col gap-4 px-4">
      <Refusal message={error} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="channel-label" className="text-sm font-medium">
          Label <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <div className="relative">
          <Megaphone
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            id="channel-label"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            maxLength={LABEL_MAX}
            disabled={pending}
            autoFocus
            className="h-8 bg-card pr-12 pl-8"
          />
          <span className="absolute top-1/2 right-2.5 -translate-y-1/2 text-[0.7rem] text-muted-foreground tabular-nums">
            {label.length}/{LABEL_MAX}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Empty = <b>{channelLabel(channel.name)}</b>.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">Tag</span>
        <div className="flex h-8 items-center gap-2 rounded-lg border border-input bg-muted/50 px-2.5 text-sm text-muted-foreground">
          <Lock className="size-3.5" aria-hidden />
          <code className="font-mono text-xs">utm_source={channel.name}</code>
        </div>
        <p className="text-xs text-muted-foreground">The tag can&apos;t change. It&apos;s in your links.</p>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-sm">
        <span className="flex flex-col">
          <span className="font-medium">Active</span>
          <span className="text-xs text-muted-foreground">{OFF_TEXT}</span>
        </span>
        <Switch checked={active} onCheckedChange={setActive} disabled={pending} />
      </label>

      {/* Stacked, longest label on top. */}
      <SheetFooter className="mt-auto px-0">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="outline" className="bg-card" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
      </SheetFooter>
    </form>
  )
}

/**
 * The open channel: one row per brand, with its link, its applies and a copy
 * button. The table sits right in the card's scroll area, so the bar shows
 * beside the rows only, like Leads Overview's tables.
 */
function ChannelLinks({
  channel,
  off,
  rows,
  shared,
  applies,
  head,
}: {
  channel: Channel
  /** Switched off: the rows are greyed and the links can't be copied. */
  off: boolean
  /** Sites two brands share, so their rows show the ending. */
  shared: Set<string>
  /** This page's brands, already sorted. */
  rows: Brand[]
  /** This channel's applies this year, Q1 to Q4, by brand id. */
  applies: Record<string, number[]>
  head: (key: "brand" | "applies") => {
    active: boolean
    desc: boolean
    onClick: () => void
  }
}) {
  if (rows.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">Add a brand first. Each brand gets its own link.</p>
    )
  }

  const brandHead = head("brand")
  const appliesHead = head("applies")
  // Wide enough to read the links; scrolls sideways on a phone.
  return (
    <table className="w-full min-w-[36rem] border-collapse text-sm">
      <thead>
        {/* No border here: the titles draw their own line, which stays while rows scroll. */}
        <tr>
          <th className={cn(HEAD, "w-64 pr-4 pl-4")} aria-sort={ariaSort(brandHead.active, brandHead.desc)}>
            <SortButton label="Brand" {...brandHead} />
          </th>
          <th className={cn(HEAD, "w-full")}>Link</th>
          <th className={cn(HEAD, "pr-6")} aria-sort={ariaSort(appliesHead.active, appliesHead.desc)}>
            <SortButton label="Applies" {...appliesHead} />
          </th>
          <th className={cn(HEAD, "pr-4 text-right")}>Copy</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((brand) => (
          <LinkRow
            key={brand.id}
            brand={brand}
            shared={shared}
            // SEO has no link: no tag already means SEO.
            link={channel.seo ? null : linkFor(brand, channel.name)}
            off={off}
            applies={quarters(applies[brand.id])}
          />
        ))}
      </tbody>
    </table>
  )
}

/** One brand's link: who it is for, the address, and a copy button that shows it worked. */
function LinkRow({
  brand,
  shared,
  link,
  off,
  applies,
}: {
  brand: Brand
  shared: Set<string>
  /** Null for SEO, which has no link. */
  link: string | null
  off: boolean
  /** This year, Q1 to Q4. */
  applies: number[]
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    if (!link || off) return
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => toast.error("Could not copy. Select it instead."))
  }

  return (
    <tr className={cn("border-b last:border-b-0", off && "text-muted-foreground")}>
      {/* A set width, so a long name ends in "…" instead of running into the link. */}
      <td className="py-2.5 pr-4 pl-4">
        <span className={cn("flex w-56 min-w-0 items-center gap-2.5", off && "opacity-60")}>
          <BrandLogo
            name={brand.name}
            logoUrl={brand.logoUrl}
            className="size-6 rounded-none border-0 bg-transparent p-0"
          />
          <span className="min-w-0">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="truncate font-medium">{brand.name}</span>
              {shared.has(siteOf(brand.domain)) ? (
                <span className="shrink-0 rounded-sm border px-1 font-mono text-[0.65rem] font-normal text-muted-foreground">
                  {tldOf(brand.domain)}
                </span>
              ) : null}
            </span>
            <span className="block truncate text-[0.7rem] text-muted-foreground">{brand.domain}</span>
          </span>
        </span>
      </td>
      {link ? (
        <td className="max-w-0 py-2.5 pr-3">
          <code className="block truncate rounded-sm bg-muted/60 px-2 py-1 font-mono text-xs select-all" title={link}>
            {link.replace("https://", "")}
          </code>
        </td>
      ) : (
        <td className="py-2.5 pr-3 text-muted-foreground">—</td>
      )}
      <td className="py-2.5 pr-6">
        {/* The same small chart as Brands: this year by quarter, and the total. */}
        <QuarterSparkline values={applies} unit={{ one: "apply", many: "applies" }} />
      </td>
      {link ? (
        <td className="py-2.5 pr-4 text-right">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  size="icon-sm"
                  className={cn("bg-card", copied && "text-success", off && "opacity-50")}
                  onClick={copy}
                  aria-disabled={off}
                  aria-label={`Copy the ${brand.name} link`}
                />
              }
            >
              {copied ? <Check /> : <Copy />}
            </TooltipTrigger>
            <TooltipContent>{off ? "This channel is off" : copied ? "Copied" : "Copy link"}</TooltipContent>
          </Tooltip>
        </td>
      ) : (
        <td className="py-2.5 pr-4 text-right text-muted-foreground">
          <span className="inline-flex size-7 items-center justify-center">—</span>
        </td>
      )}
    </tr>
  )
}

/** One input and a button, like adding a brand — the channel's name is all there is to type. */
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
    <form onSubmit={submit} className="flex w-full items-center gap-2 sm:w-auto sm:shrink-0">
      <div className="relative min-w-0 flex-1 sm:flex-none">
        <Megaphone className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="New channel, e.g. facebook"
          aria-label="Channel name"
          className="h-8 w-full bg-card pl-8 sm:w-64"
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

export { ChannelsPanel }

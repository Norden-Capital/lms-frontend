"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Globe, LoaderCircle, Megaphone, Plus } from "lucide-react"
import { toast } from "sonner"

import { addChannel } from "@/app/(app)/configuration/channels/actions"
import { Panel } from "@/components/system/panel"
import { BrandLogo } from "@/components/ui/brandLogo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageFooter, usePage } from "@/components/ui/pageFooter"
import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { channelLabel } from "@/lib/applicationTypes"
import type { Brand } from "@/lib/brands"
import type { ChannelApplies } from "@/lib/channels"
import { cn } from "@/lib/utils"

/**
 * Channels — decided 2026-11-02. A channel is the word after utm_source=, and
 * its link goes straight to the brand's apply form. Built here, so every link
 * is written the same way. SEO has no link: no tag already means SEO.
 *
 * Redone 2026-11-09 to match Brands: one card, the channels as tabs in its
 * heading beside the add box, and the open channel's links as a table.
 */

const SEO = "seo"

/** Brand links on one page of a channel. */
const PAGE_SIZE = 10

// Sticky, so the titles stay on top while the rows scroll under them.
const HEAD =
  "sticky top-0 z-10 bg-card py-2 shadow-[inset_0_-1px_0_var(--border)] text-left font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

/** https://apply.365loan.ca/?utm_source=email */
function linkFor(brand: Brand, channel: string) {
  return `https://apply.${brand.domain}/?utm_source=${channel}`
}

function ChannelsPanel({
  channels,
  brands,
  applies,
}: {
  channels: string[]
  brands: Brand[]
  applies: ChannelApplies
}) {
  const sorted = [...channels].sort((a, b) => channelLabel(a).localeCompare(channelLabel(b)))
  const [picked, setPicked] = useState<string>(sorted[0] ?? SEO)
  // A channel removed or renamed elsewhere falls back to the first one.
  const current = picked === SEO || sorted.includes(picked) ? picked : (sorted[0] ?? SEO)
  const counts = applies[current] ?? {}

  // The open channel's rows: sorted, then one page at a time.
  const { sorted: rows, head } = useSort(brands, {
    brand: (brand: Brand) => brand.name,
    applies: (brand: Brand) => counts[brand.id] ?? 0,
  })
  const [wanted, setPage] = useState(1)
  const { page, rows: shown } = usePage(rows, PAGE_SIZE, wanted)

  function open(channel: string) {
    setPicked(channel)
    setPage(1)
  }

  return (
    <Tabs value={current} onValueChange={(value) => open(String(value))} className="flex min-h-0 flex-1 flex-col">
      <Panel
        title="Channels"
        hint={<>Add a channel, then share its link. Leads from that link get the channel.</>}
        action={
          <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 sm:w-auto sm:flex-1 sm:flex-nowrap sm:gap-3">
            {/* Scrolls sideways when there are many channels. */}
            <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden sm:w-auto">
              <TabsList>
                {sorted.map((channel) => (
                  <TabsTrigger key={channel} value={channel} className="px-2.5">
                    <Megaphone data-icon="inline-start" className="size-3.5" />
                    {channelLabel(channel)}
                  </TabsTrigger>
                ))}
                <TabsTrigger value={SEO} className="px-2.5">
                  <Globe data-icon="inline-start" className="size-3.5" />
                  {channelLabel(SEO)}
                </TabsTrigger>
              </TabsList>
            </div>
            <AddChannel onAdded={open} />
          </div>
        }
        // Fills the page down to the warning; the table scrolls inside.
        className="flex-1"
        bodyClassName="p-0 overflow-auto"
        // Always there, so you can go page by page.
        footer={
          current !== SEO && brands.length > 0 ? (
            <PageFooter page={page} pageSize={PAGE_SIZE} total={brands.length} onPage={setPage} />
          ) : null
        }
      >
        {current === SEO ? <SeoDetail /> : <ChannelLinks channel={current} rows={shown} applies={counts} head={head} />}
      </Panel>
    </Tabs>
  )
}

/** SEO is the default, not something to share — so it explains itself instead. */
function SeoDetail() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted">
        <Globe className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <p className="text-sm font-medium">No link needed</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        People who come from your brand sites, or from any link with no tag, count as SEO.
      </p>
    </div>
  )
}

/**
 * The open channel: one row per brand, with its link, its applies and a copy
 * button. The table sits right in the card's scroll area, so the bar shows
 * beside the rows only, like Leads Overview's tables.
 */
function ChannelLinks({
  channel,
  rows,
  applies,
  head,
}: {
  channel: string
  /** This page's brands, already sorted. */
  rows: Brand[]
  /** This channel's applies this year, by brand id. */
  applies: Record<string, number>
  head: (key: "brand" | "applies") => { active: boolean; desc: boolean; onClick: () => void }
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
          <th className={cn(HEAD, "w-64 pl-4")} aria-sort={ariaSort(brandHead.active, brandHead.desc)}>
            <SortButton label="Brand" {...brandHead} />
          </th>
          <th className={HEAD}>Link</th>
          <th className={cn(HEAD, "pr-6 text-right")} aria-sort={ariaSort(appliesHead.active, appliesHead.desc)}>
            <SortButton label="Applies" {...appliesHead} />
          </th>
          <th className={cn(HEAD, "pr-4 text-right")}>Copy</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((brand) => (
          <LinkRow key={brand.id} brand={brand} link={linkFor(brand, channel)} applies={applies[brand.id] ?? 0} />
        ))}
      </tbody>
    </table>
  )
}

/** One brand's link: who it is for, the address, and a copy button that shows it worked. */
function LinkRow({ brand, link, applies }: { brand: Brand; link: string; applies: number }) {
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
    <tr className="border-b last:border-b-0">
      <td className="py-2.5 pl-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <BrandLogo
            name={brand.name}
            logoUrl={brand.logoUrl}
            className="size-6 rounded-none border-0 bg-transparent p-0"
          />
          <span className="min-w-0">
            <span className="block truncate font-medium">{brand.name}</span>
            <span className="block truncate text-[0.7rem] text-muted-foreground">{brand.domain}</span>
          </span>
        </span>
      </td>
      <td className="max-w-0 py-2.5 pr-3">
        <code className="block truncate rounded-sm bg-muted/60 px-2 py-1 font-mono text-xs select-all" title={link}>
          {link.replace("https://", "")}
        </code>
      </td>
      <td className="py-2.5 pr-6 text-right tabular-nums">{applies.toLocaleString("en-CA")}</td>
      <td className="py-2.5 pr-4 text-right">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                className={cn("bg-card", copied && "text-success")}
                onClick={copy}
                aria-label={`Copy the ${brand.name} link`}
              />
            }
          >
            {copied ? <Check /> : <Copy />}
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied" : "Copy link"}</TooltipContent>
        </Tooltip>
      </td>
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

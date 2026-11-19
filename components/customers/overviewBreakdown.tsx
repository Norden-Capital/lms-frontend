"use client"

import { useState } from "react"
import { Globe, Store } from "lucide-react"

import { BreakdownTable, type BreakdownRow } from "@/components/customers/breakdownTable"
import { BrandLogo, SMALL_LOGO } from "@/components/ui/brandLogo"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  channelLabel,
  sharedSites,
  siteOf,
  tldOf,
  type BrandOption,
  type Funnel,
  type OutcomeCounts,
  type OverviewBrand,
} from "@/lib/applicationTypes"

const HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const NOTES = {
  channel: "No tag means SEO. A person who came from two channels counts in both, but once in Total.",
  brand: "A person who applied on two brands counts in both, but once in Total.",
}

/**
 * Leads Overview's one wide table: by channel, or by brand with the switch.
 * Added 2026-11-10; both show the same columns since 2026-11-19.
 */
function OverviewBreakdown({
  funnel,
  brands,
  logos,
  outcomes,
}: {
  funnel: Funnel
  brands: OverviewBrand[]
  logos: BrandOption[]
  /** The cards' Leads, Abandoned and Failed: the Total row's. */
  outcomes: OutcomeCounts
}) {
  const [view, setView] = useState<keyof typeof NOTES>("channel")
  const total = { ...funnel, ...outcomes }
  const byId = new Map(logos.map((brand) => [brand.id, brand]))
  // Two brands on one site (365loan.ca and .online) look the same, so they show their ending.
  const shared = sharedSites(logos)

  const channelRows: BreakdownRow[] = funnel.channels.map((line) => ({
    ...line,
    key: line.channel,
    name: channelLabel(line.channel),
    sortName: channelLabel(line.channel),
  }))
  const brandRows: BreakdownRow[] = brands.map((brand) => {
    const option = byId.get(brand.id)
    return {
      ...brand,
      key: brand.id,
      sortName: brand.name,
      // The logo and name, and the ending when two brands share a site.
      name: (
        <span className="flex items-center gap-1.5" title={option ? `${brand.name} · ${option.domain}` : brand.name}>
          <BrandLogo name={brand.name} logoUrl={option?.logoUrl ?? null} className={SMALL_LOGO} />
          {brand.name}
          {option && shared.has(siteOf(option.domain)) ? (
            <span className="rounded-sm border px-1 font-mono text-[0.65rem] text-muted-foreground">
              {tldOf(option.domain)}
            </span>
          ) : null}
        </span>
      ),
    }
  })

  return (
    <Tabs value={view} onValueChange={(value) => setView(value as keyof typeof NOTES)}>
      <section
        className="flex min-w-0 flex-col card-shell rounded-lg border bg-muted/40 p-0.5"
        aria-labelledby="breakdown"
      >
        <div className="flex items-center justify-between gap-3 px-3 py-1">
          <h2 id="breakdown" className={HEAD}>
            {view === "channel" ? "By channel" : "By brand"}
          </h2>
          <TabsList>
            <TabsTrigger value="channel" className="px-2.5">
              <Globe data-icon="inline-start" className="size-3.5" />
              Channel
            </TabsTrigger>
            <TabsTrigger value="brand" className="px-2.5">
              <Store data-icon="inline-start" className="size-3.5" />
              Brand
            </TabsTrigger>
          </TabsList>
        </div>
        {/* A set height for both views, so switching never moves the page. The rows
            scroll inside, with the bar always shown; the column titles stay on top. */}
        <div className="h-80 overflow-x-auto overflow-y-scroll rounded-md border bg-card [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-card [&_thead_th]:shadow-[inset_0_-1px_0_var(--border)]">
          {view === "channel" ? (
            <BreakdownTable key="channel" title="Source" rows={channelRows} total={total} empty="No channels yet." />
          ) : (
            <BreakdownTable key="brand" title="Brand" rows={brandRows} total={total} empty="No brands yet." />
          )}
        </div>
        <div className="px-3 py-1.5 text-[0.7rem] text-muted-foreground">{NOTES[view]}</div>
      </section>
    </Tabs>
  )
}

export { OverviewBreakdown }

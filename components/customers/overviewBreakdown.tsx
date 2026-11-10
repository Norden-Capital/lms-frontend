"use client"

import { useState } from "react"
import { Globe, Store } from "lucide-react"

import { BrandCountsTable } from "@/components/customers/brandCountsTable"
import { ChannelFunnelTable } from "@/components/customers/channelFunnelTable"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { BrandOption, Funnel, OverviewBrand } from "@/lib/applicationTypes"

const HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const NOTES = {
  channel: "No tag means SEO. A person who came from two channels counts in both, but once in Total.",
  brand: "Each person counts once per brand, with their best result.",
}

/** Leads Overview's one wide table: by channel, or by brand with the switch. Added 2026-11-10. */
function OverviewBreakdown({
  funnel,
  brands,
  logos,
}: {
  funnel: Funnel
  brands: OverviewBrand[]
  logos: BrandOption[]
}) {
  const [view, setView] = useState<keyof typeof NOTES>("channel")

  return (
    <Tabs value={view} onValueChange={(value) => setView(value as keyof typeof NOTES)}>
      <section className="flex min-w-0 flex-col card-shell rounded-lg border bg-muted/40 p-0.5" aria-labelledby="breakdown">
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
        <div className="h-80 overflow-y-scroll rounded-md border bg-card [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10 [&_thead_th]:bg-card [&_thead_th]:shadow-[inset_0_-1px_0_var(--border)]">
          {view === "channel" ? (
            <ChannelFunnelTable funnel={funnel} />
          ) : (
            <BrandCountsTable brands={brands} logos={logos} />
          )}
        </div>
        <div className="px-3 py-1.5 text-[0.7rem] text-muted-foreground">{NOTES[view]}</div>
      </section>
    </Tabs>
  )
}

export { OverviewBreakdown }

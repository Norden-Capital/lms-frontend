import type { Metadata } from "next"

import { SitemapsTable } from "@/components/seo/sitemapsTable"
import { Panel } from "@/components/system/panel"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { getSitemaps } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Sitemaps",
}

/**
 * What has been submitted to Google, and what Google made of it.
 *
 * <p>The one screen in this section whose data is neither sampled nor rationed:
 * `sitemaps.list` returns everything at once, for free. It is also the only one
 * that could ever write — submitting and deleting are part of the same API — but
 * nothing here does yet.
 *
 * <p>⚠️ Every figure is invented — see `lib/seoSample.ts`.
 */
export default async function SeoSitemapsPage() {
  const sitemaps = await getSitemaps()
  const now = new Date()

  const failing = sitemaps.filter((sitemap) => sitemap.errors > 0).length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Panel
        title="Submitted sitemaps"
        hint={
          <>
            Your sitemaps in Google. &quot;Discovered&quot; means links found,
            not pages shown in Google.
          </>
        }
        action={
          <span className="font-mono text-[0.7rem] tabular-nums">
            <span className="text-muted-foreground">{sitemaps.length} sitemaps</span>
            {failing > 0 && (
              <span className="text-destructive"> · {failing} with errors</span>
            )}
          </span>
        }
        className="min-h-0 flex-1"
        bodyClassName="p-0"
      >
        <div className={cn("min-h-0 flex-1 overflow-y-auto", THIN_SCROLLBAR)}>
          <SitemapsTable sitemaps={sitemaps} now={now} />
        </div>
      </Panel>
    </div>
  )
}

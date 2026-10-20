import type { Metadata } from "next"

import { PagesTable } from "@/components/seo/pagesTable"
import { Panel } from "@/components/system/panel"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { count } from "@/lib/format"
import { getSeoPages } from "@/lib/seo"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Pages",
}

/**
 * Which pages earn the traffic, and what Google has indexed.
 *
 * <p>Two questions on one screen, because they are asked about the same URL and
 * answered by two different parts of Search Console. The traffic is free and
 * arrives for every page at once. The indexing answer costs one of two thousand
 * daily checks and arrives one URL at a time — so it is a per-row action rather
 * than a column that fills itself in.
 *
 * <p>⚠️ Every number is invented — see `lib/seoSample.ts`.
 */
export default async function SeoPagesPage() {
  const { pages, quota } = await getSeoPages()
  const now = new Date()

  const remaining = Math.max(0, quota.limit - quota.used)

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <Panel
        title="Pages"
        hint={
          <>
            Traffic for every page. Click Check to see if Google shows a page.
          </>
        }
        action={
          // ⚠️ "by this app" is load-bearing wording. Google does not report a
          // remaining quota — this is our own tally of the calls we made, so
          // anything else using the same property's budget is invisible to it.
          <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
            {count(remaining)} of {count(quota.limit)} checks left today (this app)
          </span>
        }
        className="min-h-0 flex-1"
        bodyClassName="p-0"
      >
        <div className={cn("min-h-0 flex-1 overflow-y-auto", THIN_SCROLLBAR)}>
          <PagesTable pages={pages} now={now} exhausted={remaining === 0} />
        </div>
      </Panel>
    </div>
  )
}

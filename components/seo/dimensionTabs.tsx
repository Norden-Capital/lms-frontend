"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import type { SeoDimension } from "@/lib/seoTypes"
import { cn } from "@/lib/utils"

/**
 * Which way the performance figures are broken down.
 *
 * <p>The same segmented look as the section tabs above it, one level down — and
 * the same reason for being links rather than a `Tabs` component: the choice
 * belongs in the address bar, so a particular breakdown can be sent to somebody.
 *
 * <p>⚠️ Two segmented strips on one screen is a real risk of confusing which is
 * which. It works here because they are visibly nested — the section tabs sit
 * above the page title's rule and these sit inside the content — but a third
 * would be one too many.
 */
function DimensionTabs({
  dimensions,
  labels,
  active,
}: {
  dimensions: SeoDimension[]
  labels: Record<SeoDimension, string>
  active: SeoDimension
}) {
  const pathname = usePathname()
  const params = useSearchParams()

  function hrefFor(dimension: SeoDimension) {
    const next = new URLSearchParams(params.toString())

    // The default is absent rather than spelled out, so the plain URL and the
    // one with ?by=query are the same address rather than two.
    if (dimension === "query") next.delete("by")
    else next.set("by", dimension)

    const query = next.toString()
    return query ? `${pathname}?${query}` : pathname
  }

  return (
    <nav
      aria-label="Break down by"
      className="inline-flex h-8 w-fit shrink-0 items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
    >
      {dimensions.map((dimension) => (
        <Link
          key={dimension}
          href={hrefFor(dimension)}
          scroll={false}
          aria-current={dimension === active ? "page" : undefined}
          className={cn(
            "relative inline-flex h-[calc(100%-1px)] items-center justify-center rounded-md border border-transparent px-2.5 text-sm font-medium whitespace-nowrap transition-all",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            dimension === active
              ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30"
              : "text-foreground/60 hover:text-foreground dark:text-muted-foreground"
          )}
        >
          {labels[dimension]}
        </Link>
      ))}
    </nav>
  )
}

export { DimensionTabs }

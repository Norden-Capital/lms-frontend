"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"

/**
 * The four SEO screens, as links.
 *
 * <p><b>Links, not a tab component.</b> Each of the four is its own route, so
 * this is navigation that happens to look like tabs — and navigation has to be
 * something you can middle-click, copy, or land on directly. A `Tabs` component
 * would hold the choice in state, which means the address bar stops describing
 * what is on screen and the Back button walks out of the section rather than
 * through it.
 *
 * <p>It borrows the look of shadcn's `TabsTrigger` and none of its behaviour.
 * The component cannot be reused directly: its active styling is driven by data
 * attributes that only its own `Tabs` root sets, so links placed inside it
 * render with no active state.
 *
 * <p>Client-side only to read the current path. The links themselves are
 * ordinary anchors, so this works before any JavaScript arrives.
 */

const TABS = [
  {
    href: "/dashboard/seo",
    label: "Overview",
    /**
     * The section root, so it matches everything beneath it unless told not to.
     * Without this the Overview tab stays lit on all four screens.
     */
    exact: true,
  },
  { href: "/dashboard/seo/performance", label: "Performance" },
  { href: "/dashboard/seo/pages", label: "Pages" },
  { href: "/dashboard/seo/sitemaps", label: "Sitemaps" },
]

function SeoTabs() {
  const pathname = usePathname()

  return (
    // shadcn's TabsList look, hand-applied: a tinted trough with a raised tile
    // marking where you are. The component itself is not used because its
    // styling hangs off `group/tabs-list` data attributes that only its own Root
    // sets — dropping links inside it produces a list with no active state at
    // all. Copying the three classes that matter is smaller than the wiring
    // needed to make the real one accept navigation.
    <nav
      aria-label="SEO sections"
      className="inline-flex h-8 w-fit shrink-0 items-center justify-center rounded-lg bg-muted p-[3px] text-muted-foreground"
    >
      {TABS.map((tab) => {
        const active = tab.exact
          ? pathname === tab.href
          : pathname === tab.href || pathname.startsWith(`${tab.href}/`)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md border border-transparent px-2.5 text-sm font-medium whitespace-nowrap transition-all",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              active
                ? "bg-background text-foreground shadow-sm dark:border-input dark:bg-input/30"
                : "text-foreground/60 hover:text-foreground dark:text-muted-foreground"
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

export { SeoTabs }

"use client"

import { CircleAlert, CircleCheck, CircleDashed, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { count, duration, percent, utcStamp } from "@/lib/format"
import type { SeoPageRow, UrlInspection } from "@/lib/seoTypes"
import { cn } from "@/lib/utils"

/**
 * Every page's traffic, and what we know about whether Google has it.
 *
 * <p><b>The index column is the unusual one.</b> Traffic arrives for all eight
 * rows in a single free call; index status costs one of two thousand daily
 * checks and answers about one URL. So the column shows one of three things —
 * never checked, an answer with its age, or an answer old enough to distrust —
 * and getting a fresh one is always an explicit act.
 *
 * <p>⚠️ <b>Two ages, and they are not the same thing.</b> "Checked 2 days ago"
 * is when <em>we</em> asked Google. "Crawled 14 Aug" is when <em>Google</em> last
 * fetched the page. They are routinely weeks apart, and a screen that shows one
 * while implying the other is worse than one that shows neither.
 */

/** Past this, an answer is old enough that it should not be read as current. */
const STALE_DAYS = 14

const VERDICT = {
  PASS: { icon: CircleCheck, tone: "text-success", label: "On Google" },
  NEUTRAL: { icon: CircleDashed, tone: "text-warning", label: "Not indexed" },
  FAIL: { icon: CircleAlert, tone: "text-destructive", label: "Excluded" },
} as const

const HEAD =
  "py-2 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

function PagesTable({
  pages,
  now,
  /** True when today's budget is gone — every check button says so. */
  exhausted,
}: {
  pages: SeoPageRow[]
  /** Decided by the caller, so the ages match between server and browser. */
  now: Date
  exhausted: boolean
}) {
  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <colgroup>
        <col style={{ width: "34%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "12%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "9%" }} />
        <col style={{ width: "26%" }} />
      </colgroup>

      <thead className="sticky top-0 z-10 bg-card">
        <tr className="border-b">
          <th className={cn(HEAD, "pl-4 text-left")}>Page</th>
          <th className={cn(HEAD, "px-3 text-right")}>Clicks</th>
          <th className={cn(HEAD, "px-3 text-right")}>Impressions</th>
          <th className={cn(HEAD, "px-3 text-right")}>CTR</th>
          <th className={cn(HEAD, "px-3 text-right")}>Position</th>
          <th className={cn(HEAD, "pr-4 text-left")}>Index status</th>
        </tr>
      </thead>

      <tbody>
        {pages.map((page) => (
          <tr key={page.key} className="border-b align-middle last:border-b-0">
            <td className="py-2.5 pl-4">
              <span className="block truncate font-mono text-xs" title={page.key}>
                {page.key}
              </span>
            </td>
            <td className="px-3 py-2.5 text-right text-xs tabular-nums">
              {count(page.clicks)}
            </td>
            <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
              {count(page.impressions)}
            </td>
            <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
              {percent(page.ctr * 100, 1)}
            </td>
            <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
              {page.position.toFixed(1)}
            </td>
            <td className="py-2.5 pr-4">
              <IndexCell
                inspection={page.inspection}
                now={now}
                exhausted={exhausted}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function IndexCell({
  inspection,
  now,
  exhausted,
}: {
  inspection: UrlInspection | null
  now: Date
  exhausted: boolean
}) {
  if (!inspection) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Not checked</span>
        <CheckButton exhausted={exhausted} label="Check" />
      </span>
    )
  }

  const verdict = VERDICT[inspection.verdict]
  const Icon = verdict.icon

  const age = Math.max(
    0,
    (now.getTime() - new Date(inspection.checkedAt).getTime()) / 1000
  )
  const stale = age > STALE_DAYS * 86_400

  return (
    <span className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={<span className="flex min-w-0 flex-1 flex-col gap-0.5" />}
        >
          <span
            className={cn(
              "flex items-center gap-1.5 text-xs font-medium",
              verdict.tone
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{verdict.label}</span>
          </span>

          {/* The age of our answer, not Google's crawl. Marked when it is old
              enough that it should be treated as history rather than status. */}
          <span
            className={cn(
              "text-[0.7rem]",
              stale ? "text-warning" : "text-muted-foreground"
            )}
          >
            checked {duration(age)} ago
          </span>
        </TooltipTrigger>

        <TooltipContent className="block max-w-[20rem] text-left leading-snug">
          <p className="font-medium">{inspection.coverageState}</p>
          <p className="mt-1 text-background/70">
            Google last crawled it{" "}
            {inspection.lastCrawledAt
              ? `${utcStamp(inspection.lastCrawledAt)} UTC`
              : "never"}
            .
          </p>
          {inspection.googleCanonical &&
            inspection.googleCanonical !== inspection.userCanonical && (
              <p className="mt-1 text-background/70">
                ⚠️ Google chose a different canonical:{" "}
                {inspection.googleCanonical}
              </p>
            )}
          <p className="mt-1 text-background/70">
            {inspection.sitemaps.length > 0
              ? `In ${inspection.sitemaps.length} sitemap${inspection.sitemaps.length === 1 ? "" : "s"}.`
              : "In no submitted sitemap."}
          </p>
          {stale && (
            <p className="mt-1 text-background/70">
              This answer is over {STALE_DAYS} days old and may no longer be true.
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      <CheckButton exhausted={exhausted} label="Check again" iconOnly />
    </span>
  )
}

/**
 * Spending one of the day's checks.
 *
 * <p>Drawn and not wired — there is no Search Console connection behind it yet.
 * `aria-disabled` rather than `disabled` so it stays hoverable and the tooltip
 * can say why, which is the same trap the inbox toolbar sprang.
 */
function CheckButton({
  exhausted,
  label,
  iconOnly,
}: {
  exhausted: boolean
  label: string
  iconOnly?: boolean
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size={iconOnly ? "icon-xs" : "xs"}
            className="ml-auto shrink-0"
            aria-disabled
            aria-label={label}
          />
        }
      >
        {iconOnly ? <RefreshCw className="size-3" /> : label}
      </TooltipTrigger>
      <TooltipContent className="block max-w-[16rem] text-left leading-snug">
        <p className="font-medium">{label}</p>
        <p className="mt-0.5 text-background/70">
          {exhausted
            ? "Today's 2,000 checks are used up. The budget resets tomorrow."
            : "Costs one of today's 2,000 checks."}
        </p>
      </TooltipContent>
    </Tooltip>
  )
}

export { PagesTable }

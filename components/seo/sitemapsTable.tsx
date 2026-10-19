import { CircleAlert, CircleCheck, Clock, TriangleAlert } from "lucide-react"

import { count, duration, utcStamp } from "@/lib/format"
import type { Sitemap } from "@/lib/seoTypes"
import { cn } from "@/lib/utils"

/**
 * What has been submitted, and what Google made of it.
 *
 * <p>Four states, and each means something different enough to be drawn
 * differently: read cleanly, read with warnings, read and rejected, or submitted
 * and not yet looked at. The last one is not a problem — it is the normal state
 * for the first day or two after submitting — which is why it is neutral rather
 * than amber.
 *
 * <p>⚠️ <b>"Discovered" is not "indexed".</b> It is how many URLs Google found
 * inside the file, and says nothing about whether any of them are on Google. The
 * two are routinely far apart, and reading one as the other is the most common
 * mistake this screen can invite — so the column is named for what it is and the
 * panel says so above it.
 */

const HEAD =
  "py-2 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

function statusOf(sitemap: Sitemap) {
  if (sitemap.isPending) {
    return { icon: Clock, tone: "text-muted-foreground", label: "Not read yet" }
  }
  if (sitemap.errors > 0) {
    return {
      icon: CircleAlert,
      tone: "text-destructive",
      label: `${count(sitemap.errors)} error${sitemap.errors === 1 ? "" : "s"}`,
    }
  }
  if (sitemap.warnings > 0) {
    return {
      icon: TriangleAlert,
      tone: "text-warning",
      label: `${count(sitemap.warnings)} warning${sitemap.warnings === 1 ? "" : "s"}`,
    }
  }
  return { icon: CircleCheck, tone: "text-success", label: "Read" }
}

/** The last segment, which is the part that differs between four sitemaps. */
function fileName(path: string): string {
  return path.split("/").pop() || path
}

function SitemapsTable({ sitemaps, now }: { sitemaps: Sitemap[]; now: Date }) {
  if (sitemaps.length === 0) {
    return (
      <p className="p-6 text-center text-sm text-muted-foreground">
        No sitemaps have been submitted.
      </p>
    )
  }

  return (
    <table className="w-full table-fixed border-collapse text-sm">
      <colgroup>
        <col style={{ width: "34%" }} />
        <col style={{ width: "14%" }} />
        <col style={{ width: "18%" }} />
        <col style={{ width: "16%" }} />
        <col style={{ width: "18%" }} />
      </colgroup>

      <thead className="sticky top-0 z-10 bg-card">
        <tr className="border-b">
          <th className={cn(HEAD, "pl-4 text-left")}>Sitemap</th>
          <th className={cn(HEAD, "px-3 text-left")}>Type</th>
          <th className={cn(HEAD, "px-3 text-left")}>Status</th>
          <th className={cn(HEAD, "px-3 text-right")}>Discovered</th>
          <th className={cn(HEAD, "pr-4 text-right")}>Last read</th>
        </tr>
      </thead>

      <tbody>
        {sitemaps.map((sitemap) => {
          const status = statusOf(sitemap)
          const Icon = status.icon

          return (
            <tr key={sitemap.path} className="border-b align-middle last:border-b-0">
              <td className="py-2.5 pl-4">
                <span className="block truncate font-mono text-xs" title={sitemap.path}>
                  {fileName(sitemap.path)}
                </span>
                <span className="block text-[0.7rem] text-muted-foreground">
                  submitted {utcStamp(sitemap.lastSubmittedAt).split(",")[0]}
                </span>
              </td>

              <td className="px-3 py-2.5 text-xs text-muted-foreground">
                {/* Google's own word, not a friendlier one — "sitemapIndex" is
                    what the API says and what its documentation calls it, so
                    translating it here would only make the two disagree. */}
                {sitemap.type}
              </td>

              <td className="px-3 py-2.5">
                <span
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-medium",
                    status.tone
                  )}
                >
                  <Icon className="size-3.5 shrink-0" aria-hidden />
                  {status.label}
                </span>
              </td>

              <td className="px-3 py-2.5 text-right text-xs tabular-nums">
                {sitemap.isPending ? (
                  <span className="text-muted-foreground/50">—</span>
                ) : (
                  count(sitemap.discoveredUrls)
                )}
              </td>

              <td className="py-2.5 pr-4 text-right text-xs text-muted-foreground tabular-nums">
                {sitemap.lastDownloadedAt ? (
                  `${duration(
                    Math.max(
                      0,
                      (now.getTime() - new Date(sitemap.lastDownloadedAt).getTime()) /
                        1000
                    )
                  )} ago`
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export { SitemapsTable }

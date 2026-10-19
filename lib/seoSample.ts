import type {
  InspectionQuota,
  SeoDay,
  SeoDimension,
  SeoMetrics,
  SeoOverview,
  SeoPageRow,
  SeoRow,
  Sitemap,
  UrlInspection,
} from "@/lib/seoTypes"

/**
 * Invented search figures, so the screens can be designed before the connection
 * to Search Console exists.
 *
 * <p>⚠️ <b>Not a measurement, and the page says so.</b> Every number here is made
 * up. It exists to answer "does this layout work" — a trend chart with no trend
 * in it tells you nothing about whether the chart is right.
 *
 * <p>Deliberately not random, for the reason every sample in this repository is
 * not: it is generated on the server and handed to components as props, so
 * anything non-deterministic would render one thing on the server and another in
 * the browser, and React would flag the mismatch.
 *
 * <p>Delete this file the day the API is real.
 */

/** Four weeks. Search Console's own default, and what the tiles compare against. */
const WINDOW = 28

/**
 * How many days at the end Google has not finished counting.
 *
 * <p>Three, which is the pessimistic end of what Search Console actually does —
 * it is usually two. Erring long is the right way round for a preview: a layout
 * that survives three dashed days survives two.
 */
const INCOMPLETE = 3

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * A day's clicks, with a shape rather than noise.
 *
 * <p>A slow climb across the month, a weekly dip at weekends, and one bad
 * Tuesday. All three are things the chart has to survive drawing: a trend, a
 * rhythm, and an outlier that must not be mistaken for the incomplete tail.
 */
function clicksFor(daysAgo: number, weekday: number): number {
  const trend = 260 + (WINDOW - daysAgo) * 7
  const weekend = weekday === 0 || weekday === 6 ? 0.55 : 1
  const slump = daysAgo === 11 ? 0.42 : 1

  return Math.round(trend * weekend * slump)
}

/**
 * The unfinished days, deliberately low.
 *
 * <p>This is the whole point of the sample: Google has counted perhaps a third
 * of the most recent day so far. Left undecorated it reads as traffic falling
 * off a cliff, which is exactly the misreading the dashed tail exists to stop —
 * so the sample has to actually produce the cliff, or the treatment is never
 * tested against anything.
 */
function settledShare(daysFromEnd: number): number {
  if (daysFromEnd >= INCOMPLETE) return 1
  return [0.3, 0.62, 0.85][daysFromEnd] ?? 1
}

function metricsFrom(days: SeoDay[]): SeoMetrics {
  const clicks = days.reduce((sum, day) => sum + day.clicks, 0)
  const impressions = days.reduce((sum, day) => sum + day.impressions, 0)

  return {
    clicks,
    impressions,
    // Recomputed from the totals, never averaged from the daily rates. The mean
    // of 28 ratios is not the ratio of the sums, and the difference is largest
    // exactly where traffic is uneven — which is always.
    ctr: impressions > 0 ? clicks / impressions : 0,
    position:
      days.length > 0
        ? days.reduce((sum, day) => sum + day.position, 0) / days.length
        : 0,
  }
}

/** One window of days, ending `endDaysAgo` days before today. */
function windowEnding(today: Date, endDaysAgo: number, incomplete: boolean): SeoDay[] {
  const days: SeoDay[] = []

  for (let offset = WINDOW - 1; offset >= 0; offset -= 1) {
    const daysAgo = endDaysAgo + offset
    const date = new Date(today)
    date.setUTCDate(date.getUTCDate() - daysAgo)

    const daysFromEnd = incomplete ? offset : WINDOW
    const share = settledShare(daysFromEnd)

    const clicks = Math.round(clicksFor(daysAgo, date.getUTCDay()) * share)
    const impressions = Math.round(clicks * (18 + (daysAgo % 5)))

    days.push({
      date: isoDate(date),
      clicks,
      impressions,
      ctr: impressions > 0 ? clicks / impressions : 0,
      // Lower is better, and it drifts down over the month — an improvement that
      // reads as a falling line, which is the one chart on this screen where
      // down is good.
      position: 18.4 - (WINDOW - daysAgo) * 0.06 + (daysAgo % 3) * 0.2,
      complete: share === 1,
    })
  }

  return days
}

export function sampleSeoOverview(now: Date): SeoOverview {
  const today = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  )

  const days = windowEnding(today, 0, true)

  // The window immediately before this one, complete throughout — it is old
  // enough that Google finished counting it long ago.
  const before = windowEnding(today, WINDOW, false)

  return {
    from: days[0].date,
    to: days[days.length - 1].date,
    totals: metricsFrom(days),
    previous: metricsFrom(before),
    days,
  }
}

/**
 * Search terms, deliberately uneven.
 *
 * <p>A long head and a long tail, because that is the shape of real search
 * traffic and it is what a table has to survive: three rows carrying most of the
 * clicks, then a run of rows with impressions and almost no clicks at all. A
 * sample where every row is similar proves nothing about the layout.
 */
const QUERIES: [string, number, number, number][] = [
  ["norden capital", 1840, 9200, 1.2],
  ["norden capital login", 910, 3100, 1.8],
  ["norden capital reviews", 604, 8800, 4.6],
  ["norden capital fees", 388, 12400, 7.9],
  ["is norden capital legit", 271, 15900, 11.4],
  ["norden capital contact", 190, 2400, 3.1],
  ["norden capital careers", 152, 6100, 14.8],
  ["capital management morocco", 96, 22800, 24.3],
  ["investment platform casablanca", 61, 18300, 31.7],
  ["norden capital app", 44, 1900, 9.2],
  ["portfolio tracker arabic", 28, 26400, 42.1],
  ["best investment app 2026", 12, 31200, 58.4],
]

const PAGES: [string, number, number, number][] = [
  ["/", 2410, 21800, 2.1],
  ["/pricing", 1180, 14200, 5.4],
  ["/about", 604, 7100, 8.2],
  ["/blog/market-outlook-2026", 512, 19600, 12.6],
  ["/careers", 288, 6400, 15.1],
  ["/contact", 196, 2900, 4.8],
  ["/blog/how-we-pick-funds", 141, 11700, 22.4],
  ["/legal/terms", 38, 1400, 28.9],
]

const COUNTRIES: [string, number, number, number][] = [
  ["Morocco", 3420, 41200, 6.1],
  ["France", 1180, 22800, 11.4],
  ["Spain", 604, 14100, 14.2],
  ["United Kingdom", 388, 9600, 18.7],
  ["United States", 241, 12400, 26.3],
]

const DEVICES: [string, number, number, number][] = [
  ["Mobile", 4820, 68400, 9.8],
  ["Desktop", 2910, 31200, 6.4],
  ["Tablet", 214, 4100, 12.1],
]

const APPEARANCE: [string, number, number, number][] = [
  ["Normal result", 7410, 96800, 9.1],
  ["Rich result", 448, 5200, 4.2],
  ["Video", 86, 1700, 16.8],
]

const BY_DIMENSION: Record<SeoDimension, [string, number, number, number][]> = {
  query: QUERIES,
  page: PAGES,
  country: COUNTRIES,
  device: DEVICES,
  searchAppearance: APPEARANCE,
}

function toRow([key, clicks, impressions, position]: [
  string,
  number,
  number,
  number,
]): SeoRow {
  return {
    key,
    clicks,
    impressions,
    ctr: impressions > 0 ? clicks / impressions : 0,
    position,
  }
}

/** One breakdown, already sorted by clicks the way the API returns it. */
export function sampleSeoRows(dimension: SeoDimension): SeoRow[] {
  return BY_DIMENSION[dimension].map(toRow)
}

/**
 * Inspections we have already paid for.
 *
 * <p>Only three of the eight pages, on purpose. The table has to show all three
 * states side by side: never checked, checked recently, and checked long enough
 * ago that the answer should be treated with suspicion.
 */
const INSPECTIONS: Record<string, UrlInspection> = {
  "/": {
    verdict: "PASS",
    coverageState: "Submitted and indexed",
    lastCrawledAt: "2026-08-18T04:12:00Z",
    googleCanonical: "https://nordencapital.com/",
    userCanonical: "https://nordencapital.com/",
    sitemaps: ["https://nordencapital.com/sitemap.xml"],
    checkedAt: "2026-08-19T09:30:00Z",
  },
  "/blog/market-outlook-2026": {
    verdict: "NEUTRAL",
    coverageState: "Crawled - currently not indexed",
    lastCrawledAt: "2026-07-29T22:41:00Z",
    googleCanonical: null,
    userCanonical: "https://nordencapital.com/blog/market-outlook-2026",
    sitemaps: ["https://nordencapital.com/sitemap-blog.xml"],
    // Deliberately old. A month-old answer presented as current is worse than
    // no answer, because it looks reliable — so the table has to age it.
    checkedAt: "2026-07-21T11:05:00Z",
  },
  "/legal/terms": {
    verdict: "FAIL",
    coverageState: "Excluded by 'noindex' tag",
    lastCrawledAt: "2026-08-11T13:58:00Z",
    googleCanonical: null,
    userCanonical: "https://nordencapital.com/legal/terms",
    sitemaps: [],
    checkedAt: "2026-08-20T08:15:00Z",
  },
}

/** The traffic table, with whatever indexing answer we happen to hold. */
export function sampleSeoPages(): SeoPageRow[] {
  return PAGES.map(toRow).map((row) => ({
    ...row,
    inspection: INSPECTIONS[row.key] ?? null,
  }))
}

/**
 * Today's inspection spend.
 *
 * <p>Three used, matching the three saved answers above — the counter and the
 * table have to agree, or the preview teaches the wrong thing about how the
 * budget is consumed.
 */
export function sampleInspectionQuota(): InspectionQuota {
  return { used: 3, limit: 2000 }
}

/**
 * Submitted sitemaps.
 *
 * <p>Four, covering the states worth designing for: healthy, warning, error, and
 * submitted-but-not-yet-read. The last one is the reason `lastDownloadedAt` is
 * nullable rather than optional.
 */
export function sampleSitemaps(): Sitemap[] {
  return [
    {
      path: "https://nordencapital.com/sitemap.xml",
      type: "sitemapIndex",
      lastSubmittedAt: "2026-03-04T10:00:00Z",
      lastDownloadedAt: "2026-08-19T02:14:00Z",
      discoveredUrls: 1042,
      errors: 0,
      warnings: 0,
      isPending: false,
    },
    {
      path: "https://nordencapital.com/sitemap-blog.xml",
      type: "sitemap",
      lastSubmittedAt: "2026-03-04T10:00:00Z",
      lastDownloadedAt: "2026-08-19T02:14:00Z",
      discoveredUrls: 318,
      errors: 0,
      warnings: 12,
      isPending: false,
    },
    {
      path: "https://nordencapital.com/sitemap-legacy.xml",
      type: "sitemap",
      lastSubmittedAt: "2025-11-18T09:20:00Z",
      lastDownloadedAt: "2026-08-19T02:15:00Z",
      discoveredUrls: 0,
      errors: 3,
      warnings: 0,
      isPending: false,
    },
    {
      path: "https://nordencapital.com/sitemap-ar.xml",
      type: "sitemap",
      lastSubmittedAt: "2026-08-20T07:45:00Z",
      lastDownloadedAt: null,
      discoveredUrls: 0,
      errors: 0,
      warnings: 0,
      isPending: true,
    },
  ]
}

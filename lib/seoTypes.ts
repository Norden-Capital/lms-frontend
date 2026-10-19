/**
 * The shapes the SEO screens draw.
 *
 * <p>Client-safe, the same split as `userTypes`, `backupTypes` and `mailTypes`:
 * the components are shared between the server pages and the client pieces, and
 * a file that reads the session cookie cannot be imported from the browser.
 *
 * <p>⚠️ Nothing produces this yet. It is written as the shape Search Console
 * returns so the screens can be built against it — see `lib/seoSample.ts` — and
 * so the day the connection exists the only change is where the data comes from.
 */

/** The four numbers Search Console reports for everything. */
export type SeoMetrics = {
  clicks: number
  impressions: number
  /** 0–1, as the API returns it. Formatted for display, never stored as "4.2%". */
  ctr: number
  /** Average position in results. Lower is better — the one metric that inverts. */
  position: number
}

/** One day of the trend. */
export type SeoDay = SeoMetrics & {
  /** YYYY-MM-DD. */
  date: string
  /**
   * Whether Google has finished counting this day.
   *
   * <p>⚠️ The last two or three days are always still being added up, and their
   * numbers rise after you look at them. Drawn as-is, a chart falls off a cliff
   * at its right-hand edge and everybody asks what went wrong — so the charts
   * draw the unfinished tail differently rather than pretending it is settled.
   *
   * <p>Search Console reports where the incomplete part starts, as
   * `first_incomplete_date`. This is that fact, per day, so no component has to
   * do the comparison itself.
   */
  complete: boolean
}

/** What the Overview screen draws. */
export type SeoOverview = {
  /** The window being reported, inclusive. */
  from: string
  to: string
  /** Totals across the window. */
  totals: SeoMetrics
  /**
   * The same window immediately before this one, for the comparison.
   *
   * <p>Not "the same dates last year": at sixteen months of retention that is
   * only available for four months of the year, and a comparison that silently
   * disappears is worse than one that was never offered.
   */
  previous: SeoMetrics
  /** Oldest first. */
  days: SeoDay[]
}

/**
 * The ways Search Console can slice the same four numbers.
 *
 * <p>These five and no others — the API accepts `query`, `page`, `country`,
 * `device` and `searchAppearance` as filterable dimensions, plus `date` and
 * `hour` for grouping. Anything else somebody asks for later is not a missing
 * feature, it is a thing Google does not record.
 */
export type SeoDimension =
  | "query"
  | "page"
  | "country"
  | "device"
  | "searchAppearance"

/** One row of a breakdown: the thing, and its four numbers. */
export type SeoRow = SeoMetrics & {
  /** The query text, the URL, the country code, the device — whatever was asked for. */
  key: string
}

/**
 * What Google says about one URL, and when we asked.
 *
 * <p>Fields chosen to match `UrlInspectionResult.indexStatusResult`, so this
 * maps across rather than being translated.
 */
export type UrlInspection = {
  /** Google's own verdict: is this URL on Google. */
  verdict: "PASS" | "FAIL" | "NEUTRAL"
  /** Google's sentence, e.g. "Submitted and indexed". Passed through verbatim. */
  coverageState: string
  /** ISO timestamp, or null if Google has never fetched it. */
  lastCrawledAt: string | null
  /** The canonical Google picked, and the one the page declared. */
  googleCanonical: string | null
  userCanonical: string | null
  /** Which submitted sitemaps list this URL. Often empty, which is itself a finding. */
  sitemaps: string[]
  /**
   * When <em>we</em> asked Google, not when Google crawled.
   *
   * <p>⚠️ The two are routinely weeks apart and mean completely different
   * things. This is the age of our answer; `lastCrawledAt` is the age of
   * Google's. A screen that shows one and labels it the other is worse than a
   * screen that shows neither.
   */
  checkedAt: string
}

/** A page in the traffic table, with whatever we know about its indexing. */
export type SeoPageRow = SeoRow & {
  /** Null until somebody spends a check on it. */
  inspection: UrlInspection | null
}

/**
 * How much of today's inspection budget is gone.
 *
 * <p>⚠️ <b>Counted by us, not reported by Google.</b> The API has no "remaining"
 * field and no header — the first thing it says about the budget is `429`, after
 * it is spent. So `used` only counts calls this application made: anything else
 * touching the same property's quota is invisible here, and the number will read
 * high. Label it as ours wherever it is drawn.
 */
export type InspectionQuota = {
  used: number
  /** 2,000 a day per property, per Search Console's published limits. */
  limit: number
}

/** One submitted sitemap, as `sitemaps.list` returns it. */
export type Sitemap = {
  /** The sitemap's own URL. */
  path: string
  /** "sitemap", "sitemapIndex", "rssFeed" — Google's own vocabulary. */
  type: string
  lastSubmittedAt: string
  /** Null when Google has submitted-but-not-yet-read it. */
  lastDownloadedAt: string | null
  /** URLs Google found inside it. */
  discoveredUrls: number
  errors: number
  warnings: number
  /** Submitted, not yet processed. */
  isPending: boolean
}

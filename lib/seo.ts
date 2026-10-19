import "server-only"

import {
  sampleInspectionQuota,
  sampleSeoOverview,
  sampleSeoPages,
  sampleSeoRows,
  sampleSitemaps,
} from "@/lib/seoSample"
import type {
  InspectionQuota,
  SeoDimension,
  SeoOverview,
  SeoPageRow,
  SeoRow,
  Sitemap,
} from "@/lib/seoTypes"

/**
 * Where the SEO screens get their figures.
 *
 * <p>The same job `lib/backups.ts` and `lib/mail.ts` do for their screens: one
 * place the pages ask, so a page never knows whether the answer came from
 * Search Console, a cache or — as today — an invented sample. When the
 * connection exists, the body of {@link getSeoOverview} becomes a call to
 * `searchanalytics.query` and nothing on the screens changes.
 *
 * <p>Async already, for that reason. A synchronous function here would mean the
 * page's `await` appears on the day the API does, and a change that touches the
 * page as well as this file is a change that can break the page.
 *
 * <p>⚠️ <b>What this cannot ever return.</b> Worth writing down beside the code
 * rather than in a document nobody opens:
 *
 * <ul>
 *   <li><b>More than sixteen months.</b> That is Search Console's retention, so
 *       no date range may offer a year-on-year comparison.</li>
 *   <li><b>Query rows that add up.</b> Google omits rare and anonymised queries,
 *       so a table of top queries always sums to less than the site total. Any
 *       screen showing both has to say why.</li>
 *   <li><b>A settled figure for the last few days.</b> See `complete` on
 *       {@link SeoDay}.</li>
 * </ul>
 */

/**
 * The Overview screen's figures.
 *
 * @param now decided by the caller and passed in, so the page and anything that
 *            formats a date agree on the moment. Reading the clock in more than
 *            one place is how a server render and its hydration disagree.
 *
 * ⚠️ Every number is invented — see `lib/seoSample.ts`.
 */
export async function getSeoOverview(now: Date): Promise<SeoOverview> {
  return sampleSeoOverview(now)
}

/**
 * One breakdown of the same four numbers.
 *
 * <p>Every dimension is the same `searchanalytics.query` call with a different
 * `dimensions` array, which is why this takes the dimension rather than there
 * being five functions.
 *
 * <p>⚠️ <b>These rows will not sum to the totals on the Overview.</b> Google
 * omits rare and anonymised queries, so a table of search terms always accounts
 * for less traffic than the site actually had. That is a property of the data,
 * not a bug to reconcile — any screen showing both has to say so.
 */
export async function getSeoRows(dimension: SeoDimension): Promise<SeoRow[]> {
  return sampleSeoRows(dimension)
}

/**
 * The pages table, and whatever indexing answers we already hold.
 *
 * <p>Two sources joined: the traffic comes from `searchanalytics.query` with
 * `dimensions: ["page"]`, and the inspections come from our own store of
 * previous URL Inspection calls. They are joined here rather than in the screen
 * so the screen never has to know that one of them costs money and the other
 * does not.
 */
export async function getSeoPages(): Promise<{
  pages: SeoPageRow[]
  quota: InspectionQuota
}> {
  return { pages: sampleSeoPages(), quota: sampleInspectionQuota() }
}

/** Submitted sitemaps, from `sitemaps.list`. */
export async function getSitemaps(): Promise<Sitemap[]> {
  return sampleSitemaps()
}

/**
 * The shape the SEO Overview draws — what the backend's `/api/seo` returns.
 *
 * <p>Real since 2026-10-20, the oneBase way: each brand's Google Analytics 4,
 * read live by the backend and kept 10 minutes. Client-safe, so the filters
 * can import it.
 */

/** Today, yesterday, the last 7 days, this month, this year, or two dates. */
export type SeoRange = "today" | "yesterday" | "7d" | "month" | "year" | "custom"

export const SEO_RANGES: { id: SeoRange; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7 days" },
  { id: "month", label: "This month" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom" },
]

/** A switched-on brand with a Google Analytics property. */
export type SeoBrand = {
  /** The brand's public id (BR-…). */
  id: string
  name: string
  logoUrl: string | null
  propertyId: string
}

/** One hour, day, week or month of the chart. */
export type TrafficPoint = {
  /** ISO date, or date and hour for a single day. */
  start: string
  sessions: number
  users: number
  organicSessions: number
  organicUsers: number
  directSessions: number
  directUsers: number
}

export type ChannelTotals = {
  sessions: number
  previousSessions: number
  users: number
  previousUsers: number
}

/** This period and the same length just before it. Rates are percent (58.4). */
export type SeoTotals = {
  sessions: number
  previousSessions: number
  users: number
  previousUsers: number
  engagementRate: number
  previousEngagementRate: number
  keyEvents: number
  previousKeyEvents: number
  averageEngagementSeconds: number
  previousAverageEngagementSeconds: number
  organic: ChannelTotals
  direct: ChannelTotals
}

export type SeoOverview = {
  brand: SeoBrand
  range: SeoRange
  start: string
  end: string
  step: "HOUR" | "DAY" | "WEEK" | "MONTH"
  fetchedAt: string
  traffic: TrafficPoint[]
  totals: SeoTotals
  channels: { channel: string; sessions: number }[]
  landingPages: { path: string; sessions: number; engagementRate: number; keyEvents: number }[]
  /** Visits that landed on pages beyond the top five. */
  landingTailSessions: number
  /** Search engines, from organic visits only. */
  engines: { source: string; sessions: number }[]
  countries: { country: string; countryId: string; sessions: number; organicSessions: number }[]
  devices: { device: string; sessions: number }[]
}

/** What the address bar says: the brand, the period, and the dates of a picked period. */
export type SeoQuery = {
  brand?: string
  range?: string
  from?: string
  to?: string
}

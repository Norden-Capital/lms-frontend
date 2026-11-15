/**
 * The Unsubscribes page's shapes and words, shared by the page (server) and its
 * table (client). Mirrors the backend's UnsubscribeDtos.
 */

/** One line of the list. `clientId` is set when the same email applied. */
export type UnsubscribeRow = {
  id: string
  email: string
  clientId: string | null
  /** The lead's name, when `clientId` is set and they gave one. */
  leadName: string | null
  brandId: string
  brand: string
  brandLogo: string | null
  brandDomain: string
  reason: string | null
  otherText: string | null
  ip: string | null
  /** ISO 8601. */
  createdAt: string
  /** ISO 8601. The list is newest first by this: unsubscribing again moves a row up. */
  updatedAt: string
}

/** On a lead's page: one brand they unsubscribed from. */
export type ClientUnsubscribe = {
  brand: string
  brandLogo: string | null
  brandDomain: string
  reason: string | null
  /** ISO 8601. */
  at: string
}

/** What the URL can carry. */
export type UnsubscribesQuery = {
  search?: string
  brand?: string
  reason?: string
  /** A preset (see DATE_PERIODS). Missing means the last 30 days. */
  period?: string
  /** Picked dates, yyyy-MM-dd, both days counted. They win over `period`. */
  from?: string
  to?: string
  /** `field,direction`: date, email, brand or reason; asc or desc. Missing means newest first. */
  sort?: string
  page?: string
  size?: string
}

/** The reasons the brand sites offer, in their order. */
export const REASONS: Record<string, string> = {
  TOO_MANY_EMAILS: "Too many emails",
  NOT_INTERESTED: "Not interested anymore",
  ALREADY_GOT_LOAN: "I already got a loan",
  NEVER_SIGNED_UP: "I never signed up",
  OTHER: "Other",
}

export function reasonLabel(reason: string | null): string {
  return reason ? (REASONS[reason] ?? reason) : "No reason given"
}

export const UNSUBSCRIBE_PAGE_SIZES = [10, 25, 50] as const

/** The page size in the URL, or 10 when it is missing or not one of the choices. */
export function unsubscribePageSize(size: string | undefined): number {
  const wanted = Number(size)
  return (UNSUBSCRIBE_PAGE_SIZES as readonly number[]).includes(wanted) ? wanted : 10
}

/** The date presets, in the menu's order. "30d" is the default. */
export const DATE_PERIODS: Record<string, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  lastMonth: "Last month",
  all: "All time",
}

export const DEFAULT_PERIOD = "30d"

/** Today in Toronto, yyyy-MM-dd. The backend counts days in Toronto time too. */
function torontoToday(now: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

function day(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * The days the backend is asked for: picked dates, a preset, or nothing at all
 * for "All time". Worked out on noon UTC of Toronto's today, so no clock change
 * can move it by a day.
 */
export function dateRange(query: UnsubscribesQuery, now = new Date()): { from?: string; to?: string } {
  if (query.from && query.to) return { from: query.from, to: query.to }
  const today = torontoToday(now)
  const base = new Date(`${today}T12:00:00Z`)
  const shift = (days: number) => day(new Date(base.getTime() - days * 86_400_000))
  switch (query.period ?? DEFAULT_PERIOD) {
    case "all":
      return {}
    case "today":
      return { from: today, to: today }
    case "7d":
      return { from: shift(6), to: today }
    case "month":
      return { from: `${today.slice(0, 7)}-01`, to: today }
    case "lastMonth": {
      const firstOfThis = new Date(`${today.slice(0, 7)}-01T12:00:00Z`)
      const lastOfPrevious = new Date(firstOfThis.getTime() - 86_400_000)
      return { from: `${day(lastOfPrevious).slice(0, 7)}-01`, to: day(lastOfPrevious) }
    }
    default:
      return { from: shift(29), to: today }
  }
}

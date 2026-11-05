/**
 * Clients and applications: the shapes and words, shared by the pages (server)
 * and their tables (client). Mirrors the backend's ApplicationDtos.
 */

export type ApplicationRow = {
  id: string
  clientId: string
  email: string
  /** Null when the answers could not be read. */
  name: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  /** "1990-05-14". */
  birthDate: string | null
  /** "QC". */
  province: string | null
  /** "full_time" — see INCOME_TYPES. Null before step 2. */
  incomeType: string | null
  /** Only for people with a job. */
  employer: string | null
  brand: string
  /** The brand's logo, read from its website. */
  brandLogo: string | null
  /** Like needaloantoday.ca. */
  brandDomain: string
  status: string
  /** SOLD, CPF, NOT_SOLD, EXISTS, ERROR, "" or null when LeadScout gave no answer. */
  leadscoutStatus: string | null
  amount: number
  language: string
  /** Sent in fake or test mode, so not a real lead. */
  test: boolean
  /** Where they came from: the link's utm_source, or "seo" with none. */
  channel: string
  createdAt: string
  updatedAt: string
}

export type ApplicationSend = {
  at: string
  mode: string
  httpStatus: number | null
  leadscoutStatus: string | null
  problem: string | null
  durationMs: number | null
  request: string | null
  response: string | null
}

export type ApplicationDetail = {
  id: string
  brand: string
  status: string
  leadscoutStatus: string | null
  redirectUrl: string | null
  amount: number
  language: string
  test: boolean
  consentAt: string
  createdAt: string
  updatedAt: string
  ip: string | null
  userAgent: string | null
  answers: Record<string, unknown>
  tracking: Record<string, unknown>
  sends: ApplicationSend[]
}

export type ClientDetail = {
  id: string
  email: string
  createdAt: string
  /** Newest first. */
  applications: ApplicationDetail[]
}

export type BrandOption = { id: string; name: string; domain: string; logoUrl: string | null }

/** ".ca" from "needaloantoday.ca". */
export function tldOf(domain: string): string {
  const dot = domain.lastIndexOf(".")
  return dot < 0 ? "" : domain.slice(dot)
}

/**
 * The site names used by more than one brand, like needaloantoday for .ca and
 * .online. Those brands show their ending, since their logos look the same.
 */
export function sharedSites(brands: BrandOption[]): Set<string> {
  const seen = new Map<string, number>()
  for (const { domain } of brands) {
    const site = siteOf(domain)
    seen.set(site, (seen.get(site) ?? 0) + 1)
  }
  return new Set([...seen].filter(([, times]) => times > 1).map(([site]) => site))
}

/** A brand's name for a list, with its ending when another brand has the same site: "NeedALoanToday .ca". */
export function brandLabel(brand: BrandOption, shared: Set<string>): string {
  return shared.has(siteOf(brand.domain)) ? `${brand.name} ${tldOf(brand.domain)}` : brand.name
}

/** "needaloantoday" from "apply.needaloantoday.ca". */
export function siteOf(domain: string): string {
  const parts = domain.toLowerCase().split(".")
  return parts.length < 2 ? domain.toLowerCase() : parts[parts.length - 2]
}

export type OverviewDay = { date: string; leads: number; abandoned: number; failed: number }

export type OverviewBrand = { id: string; name: string; leads: number; abandoned: number; failed: number }

export type ApplicationsOverview = {
  days: number
  includeTest: boolean
  leads: number
  abandoned: number
  failed: number
  /** Leads by LeadScout's answer. */
  leadscout: Record<string, number>
  daily: OverviewDay[]
  brands: OverviewBrand[]
  funnel: Funnel
}

/** People at one step each — a refresh or a second try is still one person. */
export type FunnelSteps = { visitors: number; step1: number; step2: number; step3: number }

export type ChannelCount = FunnelSteps & { channel: string }

export type Funnel = FunnelSteps & { channels: ChannelCount[] }

/** The form's income answers, in words. */
export const INCOME_TYPES: Record<string, string> = {
  full_time: "Full-time job",
  part_time: "Part-time job",
  self_employed: "Self-employed",
  gig_worker: "Gig work",
  retired: "Retired",
  disability: "Disability",
  social_security: "Government benefits",
  unemployed: "Unemployed",
}

/** "1990-05-14" → "14/05/1990", like the other dates. */
export function birthDateLabel(date: string): string {
  const [year, month, day] = date.split("-")
  return day && month && year ? `${day}/${month}/${year}` : date
}

/** "seo" → "SEO", "email" → "Email". */
export function channelLabel(channel: string): string {
  return channel === "seo" ? "SEO" : channel.charAt(0).toUpperCase() + channel.slice(1)
}

/** What a list's URL can carry. */
export type ApplicationsQuery = {
  search?: string
  brand?: string
  channel?: string
  /** `field,direction`, like `amount,desc`. Newest first when missing. */
  sort?: string
  page?: string
  size?: string
}

/** What Leads Overview's URL can carry. */
export type OverviewQuery = {
  days?: string
  brand?: string
  test?: string
}

export const APPLICATION_PAGE_SIZES = [10, 25, 50] as const

/** The page size in the URL, or 25 when it is missing or not one of the choices. */
export function applicationPageSize(size: string | undefined): number {
  const wanted = Number(size)
  return (APPLICATION_PAGE_SIZES as readonly number[]).includes(wanted) ? wanted : 25
}

export const OVERVIEW_PERIODS = [7, 30, 90] as const

export function overviewDays(days: string | undefined): number {
  const wanted = Number(days)
  return (OVERVIEW_PERIODS as readonly number[]).includes(wanted) ? wanted : 30
}

/** "1,500 $": the dollar sign after the number. */
export function money(amount: number): string {
  return `${amount.toLocaleString("en-CA")} $`
}

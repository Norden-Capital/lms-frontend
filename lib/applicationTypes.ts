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
  phone: string | null
  brand: string
  status: string
  /** SOLD, CPF, NOT_SOLD, EXISTS, ERROR, "" or null when LeadScout gave no answer. */
  leadscoutStatus: string | null
  amount: number
  language: string
  /** Sent in fake or test mode, so not a real lead. */
  test: boolean
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

export type BrandOption = { id: string; name: string }

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
}

/** What a list's URL can carry. */
export type ApplicationsQuery = {
  search?: string
  brand?: string
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

export function money(amount: number): string {
  return `$${amount.toLocaleString("en-CA")}`
}

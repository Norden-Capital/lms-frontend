"use client"

import { useEffect, useState, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Activity,
  LogOut,
  CalendarDays,
  Clock,
  Monitor,
  MousePointerClick,
  Smartphone,
  Tablet,
  Target,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { LabelLogo } from "@/components/inbox/brandLabels"
import { RangeFilter } from "@/components/seo/rangeFilter"
import { PageHeader } from "@/components/layout/pageHeader"
import { CountriesMap } from "@/components/seo/countriesMap"
import { TrafficChart } from "@/components/seo/trafficChart"
import { StatCard, type Change } from "@/components/stats/statCard"
import { Panel } from "@/components/system/panel"
import { LoadingCover } from "@/components/ui/loadingCover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { count, percent } from "@/lib/format"
import { ATLAS_ID_BY_COUNTRY } from "@/lib/seoCountryCodes"
import { SEO_RANGES, type SeoBrand, type SeoOverview, type SeoQuery, type SeoRange } from "@/lib/seoTypes"
import { cn } from "@/lib/utils"

/**
 * The SEO Overview — decided 2026-10-26: the same blocks and grid as oneBase's
 * page (map and top countries; channels and devices beside the visits chart and
 * three figures; landing pages and search engines), drawn with this app's own
 * cards, panels and colours.
 *
 * <p>The brand and the period live in the address bar. Changing either lays
 * grey shapes over the figures while the new ones load, so nothing moves.
 */

/** The figures' change against the period just before. None when there was nothing before. */
function change(now: number, before: number): Change | undefined {
  if (!before) return undefined
  return { percent: Math.round(((now - before) / before) * 100), period: "vs before" }
}

/** Bounce rate against before — red when it rises, since lower is better. */
function bounceChange(t: SeoOverview["totals"]): Change | undefined {
  if (!t.previousSessions || !t.sessions) return undefined
  const now = 100 - t.engagementRate
  const before = 100 - t.previousEngagementRate
  const moved = change(now, before)
  return moved && { ...moved, lowerIsBetter: true }
}

/** 95 → "1m 35s". */
function seconds(value: number) {
  const s = Math.max(0, Math.round(value))
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`
}

/** "last 7 days", or "13 Oct – 19 Oct 2026" for picked dates. */
function periodNote(overview: SeoOverview) {
  const preset = SEO_RANGES.find((entry) => entry.id === overview.range && entry.id !== "custom")
  if (preset) return preset.id === "7d" ? "last 7 days" : preset.label.toLowerCase()
  const fmt = (iso: string, year: boolean) =>
    new Date(`${iso}T00:00:00Z`).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: year ? "numeric" : undefined,
      timeZone: "UTC",
    })
  return overview.start === overview.end
    ? fmt(overview.start, true)
    : `${fmt(overview.start, false)} – ${fmt(overview.end, true)}`
}

/** One colour per channel, in the order they come, so a channel keeps its colour. */
/**
 * The channels the card always lists, in this order, 0 when there were none —
 * decided 2026-10-26, so the card keeps one size whatever the period. Anything
 * Google Analytics calls something else is added up in "Other".
 */
const CHANNELS = [
  "Organic Search",
  "Direct",
  "Referral",
  "Organic Social",
  "AI Assistant",
  "Email",
  "Unassigned",
]

// One colour and its shades — decided 2026-10-21 — darkest for the biggest.
const CHANNEL_TONES = ["bg-info", "bg-info/85", "bg-info/70", "bg-info/58", "bg-info/46", "bg-info/36", "bg-info/27", "bg-info/18"]
const REST_TONE = "bg-info/18"

/** Google Analytics' device names, and how they show here. */
const DEVICES: Record<string, { icon: typeof Monitor; label: string }> = {
  desktop: { icon: Monitor, label: "Computer" },
  mobile: { icon: Smartphone, label: "Phone" },
  tablet: { icon: Tablet, label: "Tablet" },
}
const DEVICE_ORDER = ["desktop", "mobile", "tablet"]
const DEVICE_TONES = ["bg-info", "bg-info/60", "bg-info/30"]

/** The heading style the panels use, for a heading inside one. */
const SUB_HEADING = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

/** The table's heading style, as on the other tables. */
const TH = "py-2 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

/** Where the chosen period is kept, in this browser only. */
const PERIOD_KEY = "seo-period"

type SavedPeriod = { range: SeoRange; from: string | null; to: string | null }

function loadPeriod(): SavedPeriod | null {
  try {
    const raw = window.localStorage.getItem(PERIOD_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as SavedPeriod
    return SEO_RANGES.some((entry) => entry.id === saved.range) ? saved : null
  } catch {
    // Storage blocked or a bad value: fall back to 7 days.
    return null
  }
}

function savePeriod(period: SavedPeriod) {
  try {
    window.localStorage.setItem(PERIOD_KEY, JSON.stringify(period))
  } catch {
    // Storage blocked: the choice simply is not remembered.
  }
}

function SeoFilters({
  brands,
  query,
  note,
  start,
  end,
  onNavigate,
}: {
  brands: SeoBrand[]
  query: SeoQuery
  /** "last 7 days" — said beside the period. */
  note: string | null
  /** The dates on screen, for the calendar to open on. */
  start: string
  end: string
  onNavigate: (url: string) => void
}) {
  const pathname = usePathname()
  const params = useSearchParams()
  const range = query.range ?? "7d"
  const brandId = query.brand ?? brands[0]?.id

  function set(values: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    onNavigate(`${pathname}?${next.toString()}`)
  }

  /** Changes the period and remembers it for the next visit. */
  function setPeriod(range: SeoRange, from: string | null, to: string | null) {
    savePeriod({ range, from, to })
    set({ range, from, to })
  }

  // 7 days unless this person picked another period before — then that one.
  // Only when the address has none, so a shared link still shows what it says.
  useEffect(() => {
    if (params.has("range")) return
    const saved = loadPeriod()
    if (!saved || saved.range === "7d") return
    set({ range: saved.range, from: saved.from, to: saved.to })
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // Brand on the left, the period on the right — where oneBase has them.
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Select value={brandId} onValueChange={(value) => value && set({ brand: value })}>
        <SelectTrigger className="h-8 w-48 bg-card" aria-label="Brand">
          <SelectValue>
            {(value: string | null) => {
              const brand = brands.find((entry) => entry.id === value)
              if (!brand) return "Choose a brand"
              return (
                <span className="flex min-w-0 items-center gap-2">
                  <LabelLogo src={brand.logoUrl} />
                  <span className="truncate">{brand.name}</span>
                </span>
              )
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false} className="min-w-max">
          {brands.map((brand) => (
            <SelectItem key={brand.id} value={brand.id} className="pr-8">
              <span className="flex items-center gap-2 whitespace-nowrap">
                <LabelLogo src={brand.logoUrl} />
                {brand.name}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex flex-wrap items-center gap-2">
        {note && (
          <p className="mr-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            Website traffic, {note}
          </p>
        )}

        {/* oneBase's period buttons; Custom opens a calendar. */}
        <RangeFilter
          value={(range as SeoRange) ?? "7d"}
          start={start}
          end={end}
          onChange={(next) => setPeriod(next, null, null)}
          onCustom={(from, to) => setPeriod("custom", from, to)}
        />
      </div>
    </div>
  )
}

/**
 * A ranked list: name, number, and a bar for its share of the whole. One bar
 * per row, all from the same edge, so a long tail stays readable.
 */
function ShareList({
  rows,
  total,
  empty,
}: {
  rows: { key: string; label: string; value: number; note?: string }[]
  total: number
  empty: string
}) {
  if (rows.length === 0) return <p className="py-4 text-center text-xs text-muted-foreground">{empty}</p>
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const share = total === 0 ? 0 : (row.value / total) * 100
        return (
          <li key={row.key} className="min-w-0">
            <div className="flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate">{row.label}</span>
              <span className="shrink-0 font-mono font-medium tabular-nums">{count(row.value)}</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-info" style={{ width: `${share}%` }} />
              </div>
              <span className="w-11 shrink-0 text-right font-mono text-[0.65rem] text-muted-foreground tabular-nums">
                {percent(share, 1)}
              </span>
            </div>
            {row.note && <p className="mt-0.5 text-[0.65rem] text-muted-foreground">{row.note}</p>}
          </li>
        )
      })}
    </ul>
  )
}

/** One bar cut into parts, then a line per part with its colour, count and share. */
function SplitBar({ rows, total }: { rows: { label: string; value: number; tone: string }[]; total: number }) {
  return (
    <div className="min-w-0">
      <div className="flex h-7 w-full gap-1">
        {total === 0 && <span className="h-full w-full rounded-sm bg-muted" />}
        {rows
          .filter((row) => row.value > 0)
          .map((row) => (
            <span
              key={row.label}
              className={cn("h-full min-w-1.5 rounded-sm", row.tone)}
              style={{ flex: "1 1 0", flexGrow: row.value }}
            />
          ))}
      </div>
      <ul className="mt-5 flex flex-col gap-2.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2 text-xs">
            <span aria-hidden className={cn("size-2.5 shrink-0 rounded-[3px]", row.tone)} />
            <span className="min-w-0 flex-1 truncate">{row.label}</span>
            <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground tabular-nums">
              {count(row.value)}
            </span>
            <span className="w-10 shrink-0 text-right font-mono font-medium tabular-nums">
              {total === 0 ? 0 : Math.round((row.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Computer, phone and tablet: three counts, then the same as one bar. */
function DeviceSplit({ rows, total }: { rows: { device: string; sessions: number }[]; total: number }) {
  if (rows.length === 0) return <p className="py-4 text-center text-xs text-muted-foreground">No visits yet.</p>
  return (
    <div className="min-w-0">
      <ul className="grid grid-cols-3 gap-3">
        {rows.map((row) => {
          const look = DEVICES[row.device]
          const Icon = look?.icon ?? Monitor
          return (
            <li key={row.device} className="min-w-0">
              <p className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
                <Icon aria-hidden className="size-3 shrink-0" />
                <span className="truncate capitalize">{look?.label ?? row.device}</span>
              </p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums">{count(row.sessions)}</p>
              <p className="font-mono text-[0.65rem] text-muted-foreground tabular-nums">
                {percent(total === 0 ? 0 : (row.sessions / total) * 100, 1)}
              </p>
            </li>
          )
        })}
      </ul>
      <div className="mt-3 flex h-2.5 w-full gap-1">
        {rows.map((row, index) => (
          <span
            key={row.device}
            aria-hidden
            className={cn("h-full min-w-1.5 rounded-[4px]", DEVICE_TONES[index] ?? REST_TONE)}
            style={{ flex: "1 1 0", flexGrow: row.sessions }}
          />
        ))}
      </div>
    </div>
  )
}

/** Up or down against the period before, under the big number. Nothing when there is no "before". */
function Trend({ value }: { value?: Change }) {
  if (!value) return null
  const rising = value.percent >= 0
  const Icon = rising ? TrendingUp : TrendingDown
  return (
    <p className={cn("mt-1.5 flex items-center gap-1 text-xs", rising ? "text-success" : "text-destructive")}>
      <Icon aria-hidden className="size-3.5 shrink-0" />
      <span className="font-mono font-medium tabular-nums">
        {rising ? "+" : ""}
        {value.percent}%
      </span>
      <span className="truncate text-muted-foreground">{value.period}</span>
    </p>
  )
}

type Series = "all" | "organic" | "direct"

function SeoBody({ overview, note }: { overview: SeoOverview; note: string }) {
  const [series, setSeries] = useState<Series>("all")
  const t = overview.totals

  const tab =
    series === "organic"
      ? { label: "Visits from search", ...t.organic }
      : series === "direct"
        ? { label: "Direct visits", ...t.direct }
        : { label: "Visits", ...t }
  const points = overview.traffic.map((point) => ({
    start: point.start,
    sessions:
      series === "organic" ? point.organicSessions : series === "direct" ? point.directSessions : point.sessions,
    users: series === "organic" ? point.organicUsers : series === "direct" ? point.directUsers : point.users,
  }))

  // Every source together — what each share is out of.
  const allSessions = overview.channels.reduce((sum, row) => sum + row.sessions, 0)
  const channelRows = [
    ...CHANNELS.map((name) => ({
      label: name,
      value: overview.channels.find((row) => row.channel === name)?.sessions ?? 0,
    })),
    {
      label: "Other",
      value: overview.channels
        .filter((row) => !CHANNELS.includes(row.channel))
        .reduce((sum, row) => sum + row.sessions, 0),
    },
  ]
  const shareOfAll = allSessions === 0 ? 0 : (tab.sessions / allSessions) * 100
  const engineTotal = overview.engines.reduce((sum, row) => sum + row.sessions, 0)

  const countries = overview.countries.map((row) => ({
    ...row,
    atlasId: ATLAS_ID_BY_COUNTRY[row.countryId] ?? "",
  }))
  const devices = [...overview.devices].sort((a, b) => {
    const ai = DEVICE_ORDER.indexOf(a.device)
    const bi = DEVICE_ORDER.indexOf(b.device)
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi)
  })

  return (
    <div className="flex min-w-0 flex-col gap-4">
      {/* ── Where in the world: the map, and the numbers beside it ─────────── */}
      <Panel title="Visitors by country" hint="Darker blue means more visits." bodyClassName="p-0">
        <div className="grid min-w-0 md:grid-cols-[minmax(0,1fr)_17rem]">
          <div className="min-w-0 p-4">
            <CountriesMap rows={countries} note={`${overview.brand.name} · ${note}`} />
          </div>

          {/* Never taller than the map: from md up the list is lifted out of
              the row's height and scrolls under its heading. */}
          <div className="relative min-w-0 border-t md:border-t-0 md:border-l">
            <div className="flex min-w-0 flex-col p-4 md:absolute md:inset-0">
              <h3 className={SUB_HEADING}>Top countries</h3>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">All visits, and how many from search.</p>
              <div className="mt-4 min-h-0 min-w-0 flex-1 md:overflow-y-auto md:pr-1">
                <ShareList
                  empty="No visits yet."
                  total={allSessions}
                  rows={countries.map((row) => ({
                    key: row.countryId || row.country,
                    label: row.country,
                    value: row.sessions,
                    note: `${count(row.organicSessions)} from search`,
                  }))}
                />
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* ── The mix, then the visits over time ─────────────────────────────── */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel
            title="Traffic by channel"
            hint="Where visits come from."
            action={
              <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                {count(allSessions)} visits
              </span>
            }
          >
            <SplitBar
              total={allSessions}
              rows={channelRows.map((row, index) => ({
                ...row,
                tone: CHANNEL_TONES[index] ?? REST_TONE,
              }))}
            />
          </Panel>

          {/* flex-1, so this column ends level with the chart beside it. */}
          <Panel title="Devices" hint="What people used to visit." className="flex-1">
            <DeviceSplit rows={devices} total={t.sessions} />
          </Panel>
        </div>

        <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
          <Panel
            title="Traffic"
            hint="Visits over the period."
            action={
              <Tabs value={series} onValueChange={(value) => setSeries(value as Series)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="organic">Organic</TabsTrigger>
                  <TabsTrigger value="direct">Direct</TabsTrigger>
                </TabsList>
              </Tabs>
            }
          >
            {/* The big number is the chart's own total. */}
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">
                {tab.label}, {note}
              </p>
              <p className="mt-1 flex items-center gap-2 font-mono text-3xl font-semibold tracking-tight tabular-nums">
                <MousePointerClick className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                {count(tab.sessions)}
              </p>
              <p className="mt-1 text-[0.7rem] text-muted-foreground">
                {count(tab.users)} visitors
                {series === "all" ? "" : ` · ${percent(shareOfAll, 1)} of all visits`}
              </p>
              <Trend value={change(tab.sessions, tab.previousSessions)} />
            </div>

            {/* Takes all the height left in the card, so there is no gap above it. */}
            <div className="flex min-h-56 min-w-0 flex-1 flex-col pt-3">
              <TrafficChart points={points} step={overview.step} />
            </div>
          </Panel>

          {/* Beside the chart on a wide screen, under it on a narrow one. */}
          <div className="flex min-w-0 flex-col gap-3">
            <StatCard
              className="flex-1"
              icon={Activity}
              label="Engagement rate"
              hint="Visits that stayed 10 seconds, saw 2 pages, or did a key event."
              value={percent(t.engagementRate, 1)}
              change={change(t.engagementRate, t.previousEngagementRate)}
            />
            <StatCard
              className="flex-1"
              icon={Target}
              label="Key events"
              hint="Important actions, like a form sent."
              value={count(t.keyEvents)}
              change={change(t.keyEvents, t.previousKeyEvents)}
            />
            <StatCard
              className="flex-1"
              icon={Clock}
              label="Time on site"
              hint="Average time per visit."
              value={seconds(t.averageEngagementSeconds)}
              change={change(t.averageEngagementSeconds, t.previousAverageEngagementSeconds)}
            />
            {/* In Google Analytics 4 a bounce is a visit that was not engaged, so
                the rate is 100 − engagement rate; no extra call to Google. */}
            <StatCard
              className="flex-1"
              icon={LogOut}
              label="Bounce rate"
              hint="Visits that left without doing anything. Lower is better."
              value={percent(t.sessions > 0 ? 100 - t.engagementRate : 0, 1)}
              change={bounceChange(t)}
            />
          </div>
        </div>
      </div>

      {/* ── Where visits started, and which search engine sent them ───────── */}
      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Panel
          title="Landing pages"
          hint="The first page of each visit."
          bodyClassName="p-0"
          footer={
            overview.landingTailSessions > 0 ? (
              <p className="px-3 py-1.5 text-[0.7rem] text-muted-foreground">
                {count(overview.landingTailSessions)} more visits started on other pages.
              </p>
            ) : undefined
          }
        >
          {overview.landingPages.length === 0 ? (
            <p className="p-4 text-center text-xs text-muted-foreground">No visits yet.</p>
          ) : (
            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-sm">
                <thead>
                  <tr className="border-b">
                    <th scope="col" className={cn(TH, "pl-4 text-left")}>
                      Page
                    </th>
                    <th scope="col" className={cn(TH, "px-3 text-right")}>
                      Visits
                    </th>
                    <th scope="col" className={cn(TH, "px-3 text-right")}>
                      Engaged
                    </th>
                    <th scope="col" className={cn(TH, "pr-4 text-right")}>
                      Key events
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {overview.landingPages.map((page) => (
                    <tr key={page.path} className="border-b last:border-b-0">
                      <td className="max-w-0 truncate py-2.5 pl-4 font-mono text-xs" title={page.path}>
                        {page.path || "/"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">{count(page.sessions)}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs tabular-nums">
                        {percent(page.engagementRate, 1)}
                      </td>
                      <td className="py-2.5 pr-4 text-right font-mono text-xs tabular-nums">{count(page.keyEvents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Search engines" hint="Visits from search, by engine.">
          <ShareList
            empty="No visits from search yet."
            total={engineTotal}
            rows={overview.engines.map((row) => ({
              key: row.source,
              label: row.source === "other" ? "Others" : row.source,
              value: row.sessions,
            }))}
          />
        </Panel>
      </div>

      {/* Says what this page can't show, so nobody looks for it. */}
      <p className="text-[0.7rem] leading-relaxed text-muted-foreground">
        From Google Analytics (property {overview.brand.propertyId}), updated every 10 minutes. Search words and
        rankings are not here — they need Search Console.
      </p>
    </div>
  )
}

/** Grey shapes in the same grid as the figures — while a brand or period loads. */
function SeoSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden>
      <Skeleton className="h-[26rem] rounded-md" />
      <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <Skeleton className="h-56 rounded-md" />
          <Skeleton className="h-36 rounded-md" />
        </div>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_15rem]">
          <Skeleton className="h-96 rounded-md" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-[7.5rem] flex-1 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="h-72 rounded-md" />
        <Skeleton className="h-72 rounded-md" />
      </div>
      <Skeleton className="h-3 w-2/3" />
    </div>
  )
}

function SeoWorkspace({
  brands,
  query,
  overview,
  error,
}: {
  brands: SeoBrand[]
  query: SeoQuery
  overview: SeoOverview | null
  /** What Google or the backend said, when the figures could not be read. */
  error: string | null
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const note = overview ? periodNote(overview) : null

  return (
    <>
      <PageHeader title="SEO overview" description="Visitors to your websites, from Google Analytics." />
      <SeoFilters
        brands={brands}
        query={query}
        note={note}
        start={overview?.start ?? new Date().toISOString().slice(0, 10)}
        end={overview?.end ?? new Date().toISOString().slice(0, 10)}
        onNavigate={(url) => start(() => router.push(url, { scroll: false }))}
      />
      {/* shrink-0, not min-h-0: the page scrolls, so this box must stay as tall
          as the figures. Squeezed to the screen's height, the loading cover
          only covered the top half. */}
      <div className="relative shrink-0">
        <LoadingCover show={pending}>
          <SeoSkeleton />
        </LoadingCover>
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : overview && note ? (
          <SeoBody key={`${overview.brand.id}|${overview.start}|${overview.end}`} overview={overview} note={note} />
        ) : null}
      </div>
    </>
  )
}

export { SeoWorkspace, SeoSkeleton }

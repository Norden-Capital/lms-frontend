"use client"

import { useState, type ReactNode } from "react"
import { ChevronDown, Mail, Phone } from "lucide-react"

import { ResultPill, StatusPill, TestPill, resultLabel, statusLabel } from "@/components/customers/applicationPills"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BrandLogo, SMALL_LOGO } from "@/components/ui/brandLogo"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Hint } from "@/components/ui/hint"
import { SortButton, ariaSort, useSort } from "@/components/ui/sortButton"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { TablePagination } from "@/components/ui/tablePagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  INCOME_TYPES,
  channelLabel,
  money,
  siteOf,
  tldOf,
  type ApplicationDetail,
  type ApplicationSend,
  type ClientDetail,
} from "@/lib/applicationTypes"
import { canadaStamp } from "@/lib/format"
import { initialsOf } from "@/lib/initials"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * One client's page — redesigned 2026-11-09. Each application used to repeat
 * every answer, so a person who applied three times showed the same name,
 * address and job three times. Now the answers show once, newest first, with
 * any older answer that differs under it. The applications are a table like
 * Leads, and a click opens one in a sheet with its technical details.
 */

/** Step 1 of the form under the name: the rest of who the person is. */
const STEP_ONE: [string, string][] = [
  ["birthDate", "Date of birth"],
  ["address", "Street"],
  ["city", "City"],
  ["province", "Province"],
  ["postalCode", "Postal code"],
]

/** Step 2 of the form, in the order it asks, under LeadScout's field names. */
const SECTIONS: { title: string; fields: [string, string][] }[] = [
  {
    title: "Home",
    fields: [
      ["timeAtAddress", "Months at address"],
      ["ownHome", "Owns home"],
      ["rentMortgagePayment", "Rent or mortgage"],
      ["propertyValue", "Home value"],
      ["propertyMortgage", "Mortgage left"],
    ],
  },
  {
    title: "Income",
    fields: [
      ["incomeType", "Income type"],
      ["monthlyIncome", "Monthly income"],
      ["directDeposit", "Direct deposit"],
      ["employerName", "Employer"],
      ["jobTitle", "Job title"],
      ["employedMonths", "Months at job"],
      ["payFrequency", "Paid"],
      ["payDate1", "Next pay date"],
    ],
  },
  {
    title: "Loan and credit",
    fields: [
      ["purpose", "Loan for"],
      ["creditScore", "Credit score"],
      ["unsecuredDebtAmount", "Debt"],
      ["financialSituation", "Bankruptcy or proposal"],
    ],
  },
]

const MONEY_FIELDS = new Set([
  "rentMortgagePayment",
  "propertyValue",
  "propertyMortgage",
  "monthlyIncome",
  "unsecuredDebtAmount",
])

const WORDS: Record<string, string> = {
  ...INCOME_TYPES,
  WEEKLY: "Every week",
  BIWEEKLY: "Every 2 weeks",
  TWICEMONTHLY: "Twice a month",
  MONTHLY: "Once a month",
  none: "None",
  inBankruptcy: "Bankruptcy",
  inConsumerProposal: "Consumer proposal",
  inDMP: "Debt management plan",
  good: "Good",
  fair: "Fair",
  low: "Low",
  unknown: "Not sure",
  yes: "Yes",
  no: "No",
}

const SUB_HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const STICKY_HEAD = "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

function show(field: string, value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No"
  if (MONEY_FIELDS.has(field) && typeof value === "number") return money(value)
  return WORDS[String(value)] ?? String(value)
}

/**
 * One answer across every application: the newest one that gave it, and any
 * different older answers. An abandoned try may stop at step 1, so the newest
 * application does not always have every answer.
 */
function answerOf(applications: ApplicationDetail[], field: string) {
  const given = applications.filter((application) => application.answers[field] !== undefined)
  if (given.length === 0) return null
  const now = show(field, given[0].answers[field])
  const before = [...new Set(given.slice(1).map((application) => show(field, application.answers[field])))].filter(
    (value) => value !== now
  )
  return { now, before }
}

/** Before: older answers that differ, small under the newest one. */
function Before({ values }: { values: string[] }) {
  if (values.length === 0) return null
  return <span className="block text-[0.7rem] font-normal text-muted-foreground">Before: {values.join(", ")}</span>
}

/**
 * Step 1 at the top: who the person is and how to reach them, then the rest of
 * their step 1 answers.
 */
function PersonCard({ client, hint }: { client: ClientDetail; hint: ReactNode }) {
  const { applications } = client
  const first = answerOf(applications, "firstName")
  const last = answerOf(applications, "lastName")
  const phone = answerOf(applications, "phone")
  const name = [first?.now, last?.now].filter(Boolean).join(" ") || client.email
  const oldNames = [...(first?.before ?? []), ...(last?.before ?? [])]

  return (
    // Built like the two cards under it: a titled frame, small labels, small values.
    <section className="shrink-0 card-shell rounded-lg border bg-muted/40 p-0.5" aria-labelledby="client-person">
      <div className="flex items-center gap-1.5 px-3 py-2">
        <h2 id="client-person" className={SUB_HEAD}>
          Personal info
        </h2>
        {hint}
      </div>

      <div className="flex flex-col rounded-md border bg-card lg:flex-row lg:items-stretch">
        {/* Who: the user page's rounded square and name, then how to reach them.
            Its line sits in the middle of the gap between the two cards below:
            their left column is 22rem, plus half the 1rem gap, less this card's
            frame (2 borders and 0.125rem of padding) and half the line. */}
        <div className="flex min-w-0 items-center gap-3 p-4 lg:w-[calc(22.375rem_-_2.5px)] lg:shrink-0 lg:border-r">
          <Avatar className="size-12 shrink-0 rounded-xl after:rounded-xl">
            <AvatarFallback className="rounded-xl text-sm font-medium">
              {initialsOf(first?.now ?? "", last?.now ?? "")}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="truncate font-heading text-base font-semibold tracking-tight">{name}</p>
            {oldNames.length > 0 ? <Before values={oldNames} /> : null}
            <p className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <Mail className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{client.email}</span>
            </p>
            {phone ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
                <Phone className="size-3.5 shrink-0" aria-hidden />
                {phone.now}
                {phone.before.length > 0 ? <span>· Before: {phone.before.join(", ")}</span> : null}
              </p>
            ) : null}
          </div>
        </div>

        {/* The rest of step 1. */}
        <dl className="grid min-w-0 flex-1 grid-cols-2 content-center gap-x-6 gap-y-3 border-t p-4 sm:grid-cols-3 lg:grid-cols-5 lg:border-t-0">
          {STEP_ONE.map(([field, label]) => {
            const answer = answerOf(applications, field)
            return (
              <div key={field} className="min-w-0 text-xs">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-medium break-words">
                  {answer?.now ?? "—"}
                  {answer ? <Before values={answer.before} /> : null}
                </dd>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}

/** A client: their answers once, then every time they applied, newest first. */
function ClientApplications({ client, sharedSites }: { client: ClientDetail; sharedSites: string[] }) {
  const { applications } = client
  const shared = new Set(sharedSites)
  const [openId, setOpenId] = useState<string | null>(null)
  const open = applications.find((application) => application.id === openId) ?? null

  // Filters and sorting, all on this page: one person has only a few applications.
  const [filter, setFilter] = useState<Filter>({})
  const shown = applications.filter(
    (application) =>
      (!filter.status || application.status === filter.status) &&
      (!filter.brand || application.brandDomain === filter.brand) &&
      (!filter.channel || application.channel === filter.channel)
  )
  const { sorted, head } = useSort<ApplicationDetail, SortKey>(shown, SORT_BY, { key: "createdAt", desc: true })
  // Pages of PAGE_SIZE. A filter can leave fewer pages, so the page is kept in range.
  const [pageWanted, setPage] = useState(1)
  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const page = Math.min(pageWanted, pages)
  const pageRows = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const statuses = [...new Set(applications.map((application) => application.status))]
  const brands = [...new Map(applications.map((application) => [application.brandDomain, application])).values()]
  const channels = [...new Set(applications.map((application) => application.channel))]

  const hint = applications.length > 1 ? <Hint>Newest answer shown. Older ones that differ are under it.</Hint> : null
  const score = applications.find((application) => application.answers.creditScore !== undefined)?.answers.creditScore

  return (
    // On a wide screen the cards fill the page and the bottom two scroll on their own.
    <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1">
      <PersonCard client={client} hint={hint} />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <section
          className="flex flex-col card-shell rounded-lg border bg-muted/40 p-0.5 lg:min-h-0"
          aria-labelledby="client-answers"
        >
          <div className="flex shrink-0 items-center gap-1.5 px-3 py-2">
            <h2 id="client-answers" className={SUB_HEAD}>
              Income and loan
            </h2>
            {hint}
          </div>

          <div className="flex flex-col gap-5 rounded-md border bg-card p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
            {SECTIONS.map((section) => {
              const lines = section.fields
                .map(([field, label]) => ({
                  field,
                  label,
                  answer: answerOf(applications, field),
                }))
                .filter((line) => line.answer !== null)
              if (lines.length === 0) return null
              return (
                <div key={section.title}>
                  <h3 className={`${SUB_HEAD} mb-2`}>{section.title}</h3>
                  <dl className="flex flex-col divide-y">
                    {lines.map(({ field, label, answer }) => (
                      <div key={field} className="flex justify-between gap-3 py-1.5 text-xs">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="min-w-0 text-right">
                          <span className="inline-flex items-center gap-1.5 font-medium break-words">
                            {field === "creditScore" && score !== undefined ? (
                              <ScoreBars value={String(score)} />
                            ) : null}
                            {answer!.now}
                          </span>
                          {answer!.before.length > 0 ? (
                            <span className="block text-[0.7rem] text-muted-foreground">
                              Before: {answer!.before.join(", ")}
                            </span>
                          ) : null}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )
            })}
          </div>
        </section>

        <section
          className="flex flex-col card-shell rounded-lg border bg-muted/40 p-0.5 lg:min-h-0"
          aria-labelledby="client-applications"
        >
          <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-1.5">
            <h2 id="client-applications" className={SUB_HEAD}>
              Applications
            </h2>
            <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
              {shown.length === applications.length ? applications.length : `${shown.length} of ${applications.length}`}
            </span>
            <div className="ml-auto flex flex-wrap gap-1.5">
              <FilterMenu
                all="All statuses"
                value={filter.status}
                options={statuses.map((status) => ({ value: status, label: statusLabel(status) }))}
                onChange={(status) => {
                  setFilter({ ...filter, status })
                  setPage(1)
                }}
              />
              <FilterMenu
                all="All brands"
                value={filter.brand}
                options={brands.map((application) => ({
                  value: application.brandDomain,
                  label: shared.has(siteOf(application.brandDomain))
                    ? `${application.brand} ${tldOf(application.brandDomain)}`
                    : application.brand,
                  icon: <BrandLogo name={application.brand} logoUrl={application.brandLogo} className={SMALL_LOGO} />,
                }))}
                onChange={(brand) => {
                  setFilter({ ...filter, brand })
                  setPage(1)
                }}
              />
              <FilterMenu
                all="All channels"
                value={filter.channel}
                options={channels.map((channel) => ({ value: channel, label: channelLabel(channel) }))}
                onChange={(channel) => {
                  setFilter({ ...filter, channel })
                  setPage(1)
                }}
              />
            </div>
          </div>

          {/* The table's own wrapper is the one that scrolls, both ways, so the
              sideways bar sits at the bottom of the card and the header stays. */}
          <div className="flex min-h-0 flex-col overflow-hidden rounded-md border bg-card lg:flex-1">
            <Table containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}>
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="hover:bg-transparent">
                  {COLUMNS.map((column, index) => {
                    const sort = head(column.key)
                    return (
                      <TableHead
                        key={column.key}
                        aria-sort={ariaSort(sort.active, sort.desc)}
                        className={cn(
                          SUB_HEAD,
                          STICKY_HEAD,
                          index === 0 && "pl-4",
                          index === COLUMNS.length - 1 && "pr-4",
                          column.center && "text-center"
                        )}
                      >
                        <SortButton label={column.label} {...sort} />
                      </TableHead>
                    )
                  })}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNS.length} className="py-8 text-center text-sm text-muted-foreground">
                      No applications match these filters.
                    </TableCell>
                  </TableRow>
                ) : null}
                {pageRows.map((application) => (
                  // The whole line opens its details.
                  <TableRow
                    key={application.id}
                    className="cursor-pointer"
                    data-state={application.id === openId ? "selected" : undefined}
                    onClick={() => setOpenId(application.id)}
                  >
                    <TableCell className="pl-4 font-mono text-xs text-muted-foreground">
                      <button
                        type="button"
                        className="hover:text-foreground hover:underline"
                        onClick={() => setOpenId(application.id)}
                        aria-label={`Open details of ${application.id}`}
                      >
                        {application.id}
                      </button>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span className="flex items-center gap-1.5">
                        <StatusPill status={application.status} />
                        {application.test ? <TestPill /> : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      <span
                        className="flex items-center gap-1.5"
                        title={`${application.brand} · ${application.brandDomain}`}
                      >
                        <BrandLogo name={application.brand} logoUrl={application.brandLogo} className={SMALL_LOGO} />
                        <span className="sr-only">{application.brand}</span>
                        {shared.has(siteOf(application.brandDomain)) ? (
                          <span className="rounded-sm border px-1 font-mono text-[0.65rem] text-muted-foreground">
                            {tldOf(application.brandDomain)}
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">{channelLabel(application.channel)}</TableCell>
                    <TableCell className="text-center text-sm whitespace-nowrap tabular-nums">
                      {money(application.amount)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {application.status === "ABANDONED" || application.status === "RETURNED" ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <ResultPill status={application.leadscoutStatus} />
                      )}
                    </TableCell>
                    <TableCell className="pr-4 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                      {canadaStamp(application.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
            <p className="pl-1 tabular-nums">
              {sorted.length === 0
                ? "No results"
                : `Showing ${(page - 1) * PAGE_SIZE + 1}–${(page - 1) * PAGE_SIZE + pageRows.length} of ${sorted.length}`}
            </p>
            <TablePagination page={page} totalPages={pages} onPage={setPage} />
          </div>
        </section>
      </div>

      <Sheet open={open !== null} onOpenChange={(next) => !next && setOpenId(null)}>
        <SheetContent className="w-full gap-0 sm:max-w-xl">
          {open ? <ApplicationSheet application={open} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}

/** The credit score bars from the apply form: 3 for good, 2 fair, 1 low, "?" for not sure. */
const SCORE_BARS: Record<string, { level: number; color: string }> = {
  good: { level: 3, color: "bg-success" },
  fair: { level: 2, color: "bg-warning" },
  low: { level: 1, color: "bg-destructive" },
}

function ScoreBars({ value }: { value: string }) {
  const score = SCORE_BARS[value]
  if (!score) return <span className="text-muted-foreground">?</span>
  return (
    <span className="flex h-3 items-end gap-px" aria-hidden>
      {[1, 2, 3].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-1 rounded-[1px]",
            bar === 1 ? "h-1.5" : bar === 2 ? "h-2.5" : "h-3",
            bar <= score.level ? score.color : "bg-border"
          )}
        />
      ))}
    </span>
  )
}

/** Applications per page. */
const PAGE_SIZE = 10

type SortKey = "id" | "status" | "brand" | "channel" | "amount" | "result" | "createdAt"

type Filter = { status?: string; brand?: string; channel?: string }

/** The table's columns. Every one sorts. */
const COLUMNS: { key: SortKey; label: string; center?: boolean }[] = [
  { key: "id", label: "Lead ID" },
  { key: "status", label: "Status" },
  { key: "brand", label: "Brand" },
  { key: "channel", label: "Channel" },
  { key: "amount", label: "Amount", center: true },
  { key: "result", label: "Result" },
  { key: "createdAt", label: "Created" },
]

/** What each column sorts by: the words people see, so the order matches the screen. */
const SORT_BY: Record<SortKey, (application: ApplicationDetail) => string | number | null> = {
  id: (application) => application.id,
  status: (application) => statusLabel(application.status),
  brand: (application) => application.brand,
  channel: (application) => channelLabel(application.channel),
  amount: (application) => application.amount,
  result: (application) =>
    application.status === "ABANDONED" || application.status === "RETURNED"
      ? null
      : resultLabel(application.leadscoutStatus),
  createdAt: (application) => application.createdAt,
}

/** A small filter in the card's title bar, built like the Leads page's. */
function FilterMenu({
  all,
  value,
  options,
  onChange,
}: {
  all: string
  value: string | undefined
  options: { value: string; label: string; icon?: ReactNode }[]
  onChange: (value: string | undefined) => void
}) {
  const picked = options.find((option) => option.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="rounded-md bg-card font-normal" />}>
        {picked?.icon}
        {picked?.label ?? all}
        <ChevronDown data-icon="inline-end" className="opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-max max-w-72 min-w-(--anchor-width)">
        <DropdownMenuRadioGroup value={value ?? ""} onValueChange={(next) => onChange(next || undefined)}>
          <DropdownMenuRadioItem value="">{all}</DropdownMenuRadioItem>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value}>
              {option.icon}
              <span className="truncate">{option.label}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** One application's details, in the sheet: the summary, the visit, and what LeadScout said. */
function ApplicationSheet({ application }: { application: ApplicationDetail }) {
  const tracking = Object.entries(application.tracking)
  const done = application.status !== "ABANDONED" && application.status !== "RETURNED"

  return (
    <>
      <SheetHeader className="gap-3 border-b">
        <div className="flex items-center gap-3">
          {/* The logo alone, without the white card behind it. */}
          <BrandLogo
            name={application.brand}
            logoUrl={application.brandLogo}
            className="size-9 rounded-none border-0 bg-transparent p-0"
          />
          <div className="min-w-0">
            <SheetTitle className="truncate font-heading text-base font-semibold tracking-tight">
              {application.brand}
            </SheetTitle>
            <SheetDescription className="font-mono text-xs">
              {application.id} · {application.brandDomain}
            </SheetDescription>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusPill status={application.status} />
          {done ? <ResultPill status={application.leadscoutStatus} /> : null}
          {application.test ? <TestPill /> : null}
        </div>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* The three numbers people look for first. */}
        <dl className="grid grid-cols-3 overflow-hidden rounded-md border bg-card text-xs">
          <SummaryCell label="Amount" value={money(application.amount)} />
          <SummaryCell label="Channel" value={channelLabel(application.channel)} />
          <SummaryCell label="Created" value={canadaStamp(application.createdAt)} />
        </dl>

        <SheetSection title="Visit">
          <Fact label="Language" value={application.language === "fr" ? "French" : "English"} />
          <Fact label="Agreed to terms" value={canadaStamp(application.consentAt)} />
          <Fact label="IP address" value={application.ip ?? "—"} mono />
          <Fact label="Browser" value={application.userAgent || "—"} wrap />
          {application.redirectUrl ? <Fact label="Offer link" value={application.redirectUrl} wrap mono /> : null}
        </SheetSection>

        {tracking.length > 0 ? (
          <SheetSection title="Tracking">
            {tracking.map(([key, value]) => (
              <Fact key={key} label={key} value={String(value)} mono />
            ))}
          </SheetSection>
        ) : null}

        <section className="card-shell rounded-lg border bg-muted/40 p-0.5">
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className={SUB_HEAD}>Sent to LeadScout</h3>
            {application.sends.length > 0 ? (
              <span className="font-mono text-[0.7rem] text-muted-foreground tabular-nums">
                {application.sends.length}
              </span>
            ) : null}
          </div>
          {application.sends.length > 0 ? (
            <ol className="flex flex-col gap-0.5">
              {application.sends.map((send, index) => (
                <SendLine key={index} send={send} number={index + 1} />
              ))}
            </ol>
          ) : (
            <p className="rounded-md border bg-card p-3 text-xs text-muted-foreground">Not sent.</p>
          )}
        </section>
      </div>
    </>
  )
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-r px-3 py-2.5 last:border-r-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate font-medium tabular-nums" title={value}>
        {value}
      </dd>
    </div>
  )
}

/** A titled card in the sheet, built like the page's cards. */
function SheetSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card-shell rounded-lg border bg-muted/40 p-0.5">
      <h3 className={`${SUB_HEAD} px-3 py-2`}>{title}</h3>
      <dl className="flex flex-col divide-y rounded-md border bg-card px-3 text-xs">{children}</dl>
    </section>
  )
}

/** One line: label left, value right. Long values wrap (`wrap`) or are cut with the full text on hover. */
function Fact({ label, value, wrap, mono }: { label: string; value: string; wrap?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 py-2">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn("min-w-0 text-right", wrap ? "break-all" : "truncate", mono && "font-mono text-[0.7rem]")}
        title={wrap ? undefined : value}
      >
        {value}
      </dd>
    </div>
  )
}

/** One send: LeadScout's answer, when, how long it took, and any problem. */
function SendLine({ send, number }: { send: ApplicationSend; number: number }) {
  const meta = [
    canadaStamp(send.at),
    send.durationMs ? `${send.durationMs} ms` : null,
    send.mode !== "live" ? `${send.mode} mode` : null,
  ]
    .filter(Boolean)
    .join(" · ")
  // Always one row (2026-11-09): a problem is cut short, with the full text on hover.
  return (
    <li className="flex items-center gap-2 rounded-md border bg-card px-3 py-2.5 text-xs whitespace-nowrap">
      <span className="shrink-0 font-mono text-muted-foreground">#{number}</span>
      <span className="shrink-0">
        <ResultPill status={send.leadscoutStatus} />
      </span>
      {send.problem ? (
        <span className="min-w-0 truncate text-destructive" title={send.problem}>
          {send.problem}
        </span>
      ) : null}
      <span className="ml-auto min-w-0 truncate text-muted-foreground tabular-nums" title={meta}>
        {meta}
      </span>
    </li>
  )
}

export { ClientApplications }

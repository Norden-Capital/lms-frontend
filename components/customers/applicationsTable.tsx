"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { ChevronDown, Search } from "lucide-react"

import { TestPill, resultLabel } from "@/components/customers/applicationPills"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LoadingCover } from "@/components/ui/loadingCover"
import { PixelLoader } from "@/components/ui/pageLoader"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TablePagination } from "@/components/ui/tablePagination"
import {
  APPLICATION_PAGE_SIZES,
  applicationPageSize,
  channelLabel,
  money,
  type ApplicationRow,
  type ApplicationsQuery,
  type BrandOption,
} from "@/lib/applicationTypes"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import type { Page } from "@/lib/userTypes"
import { cn } from "@/lib/utils"
import { canadaDate, canadaTime } from "@/lib/format"

const HEAD =
  "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const STICKY_HEAD =
  "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"


/**
 * One list of applications, built like the action log: toolbar on the tinted
 * frame, white panel, count and pages underneath. Everything lives in the
 * address, so a search can be bookmarked, and Back undoes it.
 */
function ApplicationsTable({
  page,
  query,
  brands,
  channels,
  heading,
  empty,
  showResult,
}: {
  page: Page<ApplicationRow>
  query: ApplicationsQuery
  brands: BrandOption[]
  channels: string[]
  heading: string
  empty: string
  /** Abandoned people never reached LeadScout, so that list has no result to show. */
  showResult: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [typed, setTyped] = useState(query.search ?? "")
  const [loading, startLoading] = useTransition()
  const pageSize = applicationPageSize(query.size)
  const rows = page.content
  const brandName = brands.find((brand) => brand.id === query.brand)?.name

  function go(next: ApplicationsQuery) {
    const params = new URLSearchParams()
    if (next.search) params.set("search", next.search)
    if (next.brand) params.set("brand", next.brand)
    if (next.channel) params.set("channel", next.channel)
    if (next.size) params.set("size", next.size)
    if (next.page && next.page !== "1") params.set("page", next.page)
    const qs = params.toString()
    startLoading(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-muted/40 p-0.5">
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <p className={cn(HEAD, "mr-auto pl-2")}>{heading}</p>

        <form
          className="relative"
          onSubmit={(event) => {
            event.preventDefault()
            go({ ...query, search: typed.trim() || undefined, page: undefined })
          }}
        >
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Search by email..."
            aria-label="Search by email"
            className="h-8 w-56 rounded-md bg-transparent pl-8"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="rounded-md bg-transparent font-normal" />}
          >
            {brandName ?? "All brands"}
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuRadioGroup
              value={query.brand ?? ""}
              onValueChange={(value) => go({ ...query, brand: value || undefined, page: undefined })}
            >
              <DropdownMenuRadioItem value="">All brands</DropdownMenuRadioItem>
              {brands.map((brand) => (
                <DropdownMenuRadioItem key={brand.id} value={brand.id}>
                  {brand.name}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="outline" className="rounded-md bg-transparent font-normal" />}
          >
            {query.channel ? channelLabel(query.channel) : "All channels"}
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-40">
            <DropdownMenuRadioGroup
              value={query.channel ?? ""}
              onValueChange={(value) => go({ ...query, channel: value || undefined, page: undefined })}
            >
              <DropdownMenuRadioItem value="">All channels</DropdownMenuRadioItem>
              {channels.map((channel) => (
                <DropdownMenuRadioItem key={channel} value={channel}>
                  {channelLabel(channel)}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="rounded-md bg-transparent font-normal"
                aria-label={`Rows per page: ${pageSize}`}
              />
            }
          >
            {pageSize} rows
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              onValueChange={(value) => go({ ...query, size: value, page: undefined })}
            >
              {APPLICATION_PAGE_SIZES.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size} rows
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
        <LoadingCover show={loading} className="top-10 flex items-center justify-center bg-card">
          <PixelLoader />
        </LoadingCover>
        <Table
          containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}
          className={cn(rows.length === 0 && "h-full")}
        >
          <TableHeader className="[&_tr]:border-b-0">
            <TableRow className="hover:bg-transparent">
              <TableHead className={cn(HEAD, STICKY_HEAD, "pl-4")}>Date</TableHead>
              <TableHead className={cn(HEAD, STICKY_HEAD)}>Time</TableHead>
              <TableHead className={cn(HEAD, STICKY_HEAD)}>Name</TableHead>
              <TableHead className={cn(HEAD, STICKY_HEAD)}>Email</TableHead>
              <TableHead className={cn(HEAD, STICKY_HEAD)}>Phone</TableHead>
              <TableHead className={cn(HEAD, STICKY_HEAD)}>Brand</TableHead>
              <TableHead className={cn(HEAD, STICKY_HEAD)}>Channel</TableHead>
              <TableHead className={cn(HEAD, STICKY_HEAD, "text-right")}>Amount</TableHead>
              {showResult ? <TableHead className={cn(HEAD, STICKY_HEAD, "pr-4")}>Result</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={9} className="text-center align-middle text-sm text-muted-foreground">
                  {query.search || query.brand || query.channel ? "Nothing matches." : empty}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {canadaDate(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                    {canadaTime(row.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-48">
                    <span className="flex items-center gap-2">
                      <Link
                        href={`/customers/clients/${row.clientId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {row.name ?? "Open client"}
                      </Link>
                      {row.test ? <TestPill /> : null}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-56 truncate text-sm">{row.email}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap tabular-nums">{row.phone ?? "—"}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{row.brand}</TableCell>
                  <TableCell className="text-sm whitespace-nowrap">{channelLabel(row.channel)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{money(row.amount)}</TableCell>
                  {showResult ? (
                    <TableCell className="pr-4 text-sm whitespace-nowrap">
                      {resultLabel(row.leadscoutStatus)}
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
        <p className="pl-1 tabular-nums">
          {page.totalElements === 0
            ? "No results"
            : `Showing ${page.page * pageSize + 1}–${page.page * pageSize + rows.length} of ${page.totalElements}`}
        </p>

        <TablePagination
          page={page.page + 1}
          totalPages={Math.max(1, page.totalPages)}
          onPage={(next) => go({ ...query, page: String(next) })}
        />
      </div>
    </div>
  )
}

export { ApplicationsTable }

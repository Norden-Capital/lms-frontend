import { ChevronsUpDown } from "lucide-react"

import { PageHeader } from "@/components/layout/pageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * The customer screens' loaders — added 2026-11-09. Grey shapes the size of the
 * real content, so nothing moves when it arrives.
 */

const HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const STICKY_HEAD = "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

/** The table's columns shown by default, with the width of their grey bar. */
const COLUMNS: { label: string; bar: string; center?: boolean; result?: boolean }[] = [
  { label: "Lead ID", bar: "h-3 w-16" },
  { label: "Name", bar: "h-3.5 w-24" },
  { label: "Email", bar: "h-3.5 w-40" },
  { label: "Phone", bar: "h-3.5 w-24" },
  { label: "Date of birth", bar: "mx-auto h-3.5 w-20", center: true },
  { label: "Province", bar: "mx-auto h-3.5 w-8", center: true },
  { label: "Brand", bar: "size-4 rounded-sm" },
  { label: "Channel", bar: "h-3.5 w-14" },
  { label: "Amount", bar: "mx-auto h-3.5 w-14", center: true },
  { label: "Income type", bar: "h-3.5 w-24" },
  { label: "Employer", bar: "h-3.5 w-28" },
  { label: "Result", bar: "h-5 w-16 rounded-full", result: true },
  { label: "Created", bar: "h-3 w-28" },
]

/** Leads, Abandoned and Failed while they load: header, toolbar, table and footer. */
function ApplicationsSkeleton({
  title,
  description,
  heading,
  showResult = true,
}: {
  title: string
  description: string
  heading: string
  showResult?: boolean
}) {
  const columns = COLUMNS.filter((column) => showResult || !column.result)

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3" role="status" aria-label="Loading">
      <PageHeader title={title} description={description} />

      <div className="flex min-h-0 flex-1 flex-col card-shell rounded-md border bg-muted/40 p-0.5" aria-hidden>
        <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
          <p className={cn(HEAD, "mr-auto pl-2")}>{heading}</p>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="size-7" />
          <Skeleton className="size-7" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
          <Table containerClassName="min-h-0 flex-1 overflow-hidden">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                  <Skeleton className="size-4 rounded-[4px]" />
                </TableHead>
                {columns.map(({ label, center }, index) => (
                  <TableHead
                    key={label}
                    className={cn(HEAD, STICKY_HEAD, center && "text-center", index === columns.length - 1 && "pr-4")}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <ChevronsUpDown className="size-3 opacity-40" />
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }, (_, row) => (
                <TableRow key={row} className="hover:bg-transparent">
                  <TableCell className="w-10 pl-4">
                    <Skeleton className="size-4 rounded-[4px]" />
                  </TableCell>
                  {columns.map(({ label, bar }, index) => (
                    <TableCell key={label} className={cn("py-3", index === columns.length - 1 && "pr-4")}>
                      <Skeleton className={bar} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5">
          <Skeleton className="ml-1 h-3 w-32" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </div>
  )
}

export { ApplicationsSkeleton }

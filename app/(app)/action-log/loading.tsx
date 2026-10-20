import { ChevronsUpDown } from "lucide-react"

import { ActionLogRowsSkeleton } from "@/components/actionLog/actionLogLoading"
import { PageHeader } from "@/components/layout/pageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

/**
 * The action log while it first loads — decided 2026-10-20. The same frame,
 * toolbar, headings and footer as the real table, with grey rows, so nothing
 * moves when the log arrives.
 */

const HEAD =
  "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const STICKY_HEAD =
  "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

const COLUMNS = [
  { label: "When" },
  { label: "What" },
  { label: "Who" },
  { label: "To whom" },
  { label: "Details" },
  { label: "Address", className: "pr-4" },
]

export default function ActionLogLoading() {
  return (
    <div
      className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3"
      role="status"
      aria-label="Loading"
    >
      <PageHeader
        title="Action Log"
        description="Who did what, and when. Only you can see this."
      />

      <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-muted/40 p-0.5" aria-hidden>
        <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
          <p className={cn(HEAD, "mr-auto pl-2")}>All activity</p>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="size-7 rounded-full" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
          <Table containerClassName="shrink-0 overflow-hidden">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                  <Skeleton className="size-4 rounded-[4px]" />
                </TableHead>
                {COLUMNS.map(({ label, className }) => (
                  <TableHead key={label} className={cn(HEAD, STICKY_HEAD, className)}>
                    <span className="inline-flex items-center gap-1">
                      {label}
                      <ChevronsUpDown className="size-3 opacity-40" />
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          </Table>
          <div className="min-h-0 flex-1 overflow-hidden">
            <ActionLogRowsSkeleton />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5">
          <Skeleton className="ml-1 h-3 w-32" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    </div>
  )
}

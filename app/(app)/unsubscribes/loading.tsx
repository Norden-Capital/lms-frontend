import { PageHeader } from "@/components/layout/pageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const STICKY_HEAD = "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

const COLUMNS = [
  { label: "Date", bar: "h-3 w-28" },
  { label: "Email", bar: "h-3.5 w-40" },
  { label: "Brand", bar: "h-3.5 w-24" },
  { label: "Reason", bar: "h-3.5 w-32" },
  { label: "Lead", bar: "h-3.5 w-20" },
]

/** Unsubscribes while it loads — the same screen, in grey. */
export default function UnsubscribesLoading() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden p-6 pb-3" role="status" aria-label="Loading">
      <PageHeader title="Unsubscribes" description="People who asked to stop getting emails from a brand." />

      <div className="flex min-h-0 flex-1 flex-col card-shell rounded-md border bg-muted/40 p-0.5" aria-hidden>
        <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
          <p className={cn(HEAD, "mr-auto pl-2")}>All unsubscribes</p>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
          <Table containerClassName="min-h-0 flex-1 overflow-hidden">
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                  <Skeleton className="size-4 rounded-[4px]" />
                </TableHead>
                {COLUMNS.map(({ label }, index) => (
                  <TableHead
                    key={label}
                    className={cn(HEAD, STICKY_HEAD, index === COLUMNS.length - 1 && "pr-4")}
                  >
                    {label}
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
                  {COLUMNS.map(({ label, bar }, index) => (
                    <TableCell
                      key={label}
                      className={cn("py-3", index === COLUMNS.length - 1 && "pr-4")}
                    >
                      <Skeleton className={bar} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

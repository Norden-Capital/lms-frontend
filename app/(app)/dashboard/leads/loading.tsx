import { PageHeader } from "@/components/layout/pageHeader"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Leads Overview while it loads — added 2026-11-09. The same blocks in the same
 * order as the page: funnel cards, the channel table, the four counts, the
 * chart, then the brand table beside LeadScout's answers.
 */

const HEAD = "px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

const FUNNEL = ["Form visitors", "Step 1", "Step 2", "Step 3 - Got the link"]
const COUNTS = ["Leads", "Abandoned", "Failed", "Finish rate"]
const ANSWERS = ["Sold", "CPF", "Not sold", "Already applied"]

/** A row of four stat cards: label, figure, and the line under it. */
function Cards({ labels, detail = false }: { labels: string[]; detail?: boolean }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {labels.map((label) => (
        <div key={label} className="flex flex-col rounded-lg border bg-muted/40 p-0.5">
          <div className="flex grow flex-col rounded-md border bg-card px-3 py-2.5 shadow-sm">
            <p className="truncate font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase">
              {label}
            </p>
            <div className="pt-1">
              <Skeleton className="my-1 h-5 w-16" />
              {detail ? <Skeleton className="mt-1.5 h-3 w-28" /> : null}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/** A small table: its headings, then grey rows. */
function TableBlock({ columns, rows }: { columns: string[]; rows: number }) {
  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs text-muted-foreground">
        <tr>
          {columns.map((label, index) => (
            <th key={label} className={index === 0 ? "px-4 py-2 font-medium" : "px-4 py-2 text-right font-medium"}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row} className="border-t">
            {columns.map((label, index) => (
              <td key={label} className="px-4 py-2">
                <Skeleton className={index === 0 ? "h-4 w-24" : "ml-auto h-4 w-8"} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function LeadsOverviewLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-label="Loading">
      <PageHeader
        title="Leads Overview"
        description="How many people applied, and how far they got."
        actions={
          <div className="flex flex-wrap items-center gap-2" aria-hidden>
            <Skeleton className="h-9 w-56" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-5 w-28" />
          </div>
        }
      />

      <div className="contents" aria-hidden>
        <Cards labels={FUNNEL} detail />

        <section className="rounded-lg border bg-muted/40 p-0.5">
          <h2 className={HEAD}>By channel</h2>
          <div className="overflow-hidden rounded-md border bg-card">
            <TableBlock columns={["Channel", "Visitors", "Step 1", "Step 2", "Step 3"]} rows={4} />
          </div>
          <Skeleton className="mx-3 my-2 h-3 w-96 max-w-[80%]" />
        </section>

        <Cards labels={COUNTS} />

        <section className="rounded-lg border bg-muted/40 p-0.5">
          <h2 className={HEAD}>Leads per day</h2>
          <div className="rounded-md border bg-card p-4 pt-6">
            <Skeleton className="h-44 w-full" />
            <div className="mt-1 flex justify-between">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        </section>

        <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
          <section className="rounded-lg border bg-muted/40 p-0.5">
            <h2 className={HEAD}>By brand</h2>
            <div className="overflow-hidden rounded-md border bg-card">
              <TableBlock columns={["Brand", "Leads", "Abandoned", "Failed"]} rows={4} />
            </div>
          </section>

          <section className="rounded-lg border bg-muted/40 p-0.5">
            <h2 className={HEAD}>LeadScout answers</h2>
            <dl className="flex flex-col rounded-md border bg-card text-sm">
              {ANSWERS.map((label, index) => (
                <div
                  key={label}
                  className={index === 0 ? "flex justify-between px-4 py-2" : "flex justify-between border-t px-4 py-2"}
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>
                    <Skeleton className="h-4 w-8" />
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>
    </div>
  )
}

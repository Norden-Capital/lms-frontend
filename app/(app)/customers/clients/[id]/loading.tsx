import { Skeleton } from "@/components/ui/skeleton"

/**
 * A client while it loads — added 2026-11-09. The back button and title, then
 * one application card: its top line, four answer columns, and the facts.
 */

const SECTIONS = ["About", "Address", "Income", "Loan and credit"]

const SUB_HEAD = "mb-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

export default function ClientLoading() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-label="Loading">
      <div className="flex flex-col gap-1" aria-hidden>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5" />
          <Skeleton className="h-6 w-44" />
        </div>
        <Skeleton className="h-3 w-64" />
      </div>

      <section className="rounded-lg border bg-muted/40 p-0.5" aria-hidden>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="ml-auto h-3 w-48" />
        </div>

        <div className="flex flex-col gap-5 rounded-md border bg-card p-4">
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {SECTIONS.map((title) => (
              <div key={title}>
                <h3 className={SUB_HEAD}>{title}</h3>
                <div className="flex flex-col gap-1.5">
                  {Array.from({ length: 5 }, (_, line) => (
                    <div key={line} className="flex h-5 items-center justify-between gap-3">
                      <Skeleton className="h-3.5 w-20" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-x-6 gap-y-1.5 border-t pt-4 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, line) => (
              <div key={line} className="flex h-4 items-center justify-between gap-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

import type { ReactNode } from "react"

import { PageHeader } from "@/components/layout/pageHeader"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * Leads Overview while it loads — redone 2026-11-10 with the calm page: the
 * same cards in the same places, with grey shapes where the charts will draw.
 */

const HEAD = "px-3 py-2 font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"
const LABEL = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

/** A titled card with a line under it, like the page's. */
function Block({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn("flex min-w-0 flex-col card-shell rounded-lg border bg-muted/40 p-0.5", className)}>
      <h2 className={HEAD}>{title}</h2>
      <div className="flex flex-1 flex-col rounded-md border bg-card p-4">{children}</div>
      <Skeleton className="mx-3 my-2 h-3 w-40" />
    </section>
  )
}

/** A count card: label, the figure, then its quiet line. */
function TrendCard({ label }: { label: string }) {
  return (
    <section className="flex min-w-0 flex-col card-shell rounded-lg border bg-muted/40 p-0.5 xl:h-40">
      <div className="flex flex-1 flex-col rounded-md border bg-card px-4 pt-3.5 pb-2">
        <p className={LABEL}>{label}</p>
        <Skeleton className="mt-2 h-8 w-16" />
        <Skeleton className="mt-auto h-9 w-full" />
      </div>
      <Skeleton className="mx-3 my-2 ml-auto h-3 w-28" />
    </section>
  )
}

/** Grey table rows. */
function Rows() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }, (_, index) => (
        <Skeleton key={index} className="h-5 w-full" />
      ))}
    </div>
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
        <div className="grid gap-3 xl:grid-cols-[6fr_4fr]">
          <div className="flex min-w-0 flex-col gap-3 max-xl:contents">
            <Block title="Form funnel" className="h-72 max-xl:order-2 xl:h-[calc(15rem+6px)]">
              <Skeleton className="h-full w-full rounded-md" />
            </Block>
            <Block title="Applications per day" className="max-xl:order-3 xl:flex-1">
              <div className="mb-4 flex items-center gap-5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="min-h-48 w-full flex-1" />
            </Block>
          </div>
          <div className="flex min-w-0 flex-col gap-3 max-xl:contents">
            <div className="grid grid-cols-2 gap-3 max-xl:order-1">
              {["Leads", "Abandoned", "Failed", "Finish rate"].map((label) => (
                <TrendCard key={label} label={label} />
              ))}
            </div>
            <Block title="LeadScout answers" className="max-xl:order-4">
              <div className="flex flex-col gap-4">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full rounded-[2px]" />
                  </div>
                ))}
              </div>
            </Block>
          </div>
        </div>

        <Block title="By channel" className="[&>div:first-of-type]:h-80">
          <Rows />
        </Block>
      </div>
    </div>
  )
}

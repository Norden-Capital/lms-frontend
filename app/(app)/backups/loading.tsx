import { ChevronsUpDown, HardDrive, History, Hourglass, Repeat } from "lucide-react"

import { BackupRowsSkeleton } from "@/components/backups/backupLoading"
import { PageHeader } from "@/components/layout/pageHeader"
import { StatCard } from "@/components/stats/statCard"
import { Panel } from "@/components/system/panel"
import { Skeleton } from "@/components/ui/skeleton"
import { GAP } from "@/lib/backupChart"
import { cn } from "@/lib/utils"

/**
 * Backups while they first load — decided 2026-10-20. The same header, the
 * year, the log and the four cards, in the same grid at the same sizes, with
 * grey shapes for the figures, so nothing moves when they arrive.
 */

const HEAD =
  "py-2 font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

const COLUMNS = [
  { label: "Created at", width: "24%", className: "pl-4 text-left" },
  { label: "Status", width: "18%", className: "px-3 text-left" },
  { label: "Size", width: "18%", className: "px-3 text-right" },
  { label: "Duration", width: "19%", className: "px-3 text-right" },
]

const WEEKDAYS = ["", "Mon", "", "Wed", "", "Fri", ""]

const KEYS = [
  { tone: "bg-foreground", label: "Backed up" },
  { tone: "bg-destructive", label: "Failed" },
  { tone: "bg-foreground/[0.07]", label: "Nothing ran" },
]

/** A grey shape that can sit inside a line of text, where a div cannot. */
function Bone({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-block animate-pulse rounded-md bg-muted align-middle", className)}
    />
  )
}

/** The year: a calendar of nights, the months under it, and the key. */
function YearSkeleton() {
  return (
    <Panel
      title="The year"
      action={
        <span className="flex items-center gap-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-5 w-21" />
        </span>
      }
      className="shrink-0"
      bodyClassName="gap-0 p-3"
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1 overflow-hidden py-1.5">
          <div className="mx-auto grid w-fit grid-cols-[auto_minmax(0,1fr)] gap-x-1.5">
            <div
              className={cn(
                "flex flex-col font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase",
                GAP
              )}
            >
              {WEEKDAYS.map((day, row) => (
                <span key={row} className="flex flex-1 items-center leading-none">
                  {day}
                </span>
              ))}
            </div>

            {/* 53 weeks of seven squares, with the gaps between them. */}
            <Skeleton className="h-[88px] w-[686px] rounded-sm min-[1740px]:h-[91.5px] min-[1740px]:w-[712.5px]" />

            <div />

            <div className="mt-2 border-t pt-1.5">
              <Skeleton className="h-3 w-full" />
            </div>

            <div />

            <div className="mt-2 flex items-center justify-end gap-3 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
              {KEYS.map((key) => (
                <span key={key.label} className="flex items-center gap-1">
                  <span className={cn("size-2 rounded-[2px] ring-1 ring-border", key.tone)} />
                  {key.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="hidden w-[280px] shrink-0 items-center justify-center border-l pl-4 min-[1740px]:flex min-[1900px]:w-[380px]">
          <Skeleton className="aspect-[4/3] w-full rounded-full" />
        </div>
      </div>
    </Panel>
  )
}

/** The log: its headings, grey runs, and the count and pages under it. */
function LogSkeleton() {
  return (
    <Panel
      title="Log"
      action={
        <span className="flex items-center gap-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-6 w-20" />
        </span>
      }
      footer={
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5">
          <Skeleton className="ml-1 h-3 w-32" />
          <Skeleton className="h-6 w-32" />
        </div>
      }
      className="lg:min-h-48 lg:flex-1"
      bodyClassName="p-0"
    >
      <div className="overflow-hidden lg:min-h-0 lg:flex-1">
        <table className="w-full table-fixed border-collapse text-sm">
          <colgroup>
            {COLUMNS.map((column) => (
              <col key={column.label} style={{ width: column.width }} />
            ))}
            <col style={{ width: "21%" }} />
          </colgroup>
          <thead>
            <tr className="border-b">
              {COLUMNS.map((column) => (
                <th key={column.label} className={cn(HEAD, column.className)}>
                  <span className="inline-flex items-center gap-1">
                    {column.label}
                    <ChevronsUpDown className="size-3 opacity-40" />
                  </span>
                </th>
              ))}
              <th className={cn(HEAD, "pr-4 text-right whitespace-nowrap")}>Actions</th>
            </tr>
          </thead>
        </table>
        <BackupRowsSkeleton />
      </div>
    </Panel>
  )
}

export default function BackupsLoading() {
  return (
    <div
      className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-3 sm:p-6 lg:overflow-hidden"
      role="status"
      aria-label="Loading"
    >
      <PageHeader
        title="Backups"
        description="Copies of your data, kept safe."
        actions={
          <div className="flex items-center gap-2" aria-hidden>
            <Skeleton className="h-7 w-28" />
            <Skeleton className="size-7" />
          </div>
        }
      />

      <div
        className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]"
        aria-hidden
      >
        <div className="flex flex-col gap-4 lg:min-h-0">
          <YearSkeleton />
          <LogSkeleton />
        </div>

        {/* The four cards, in the real card at the real sizes. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:h-full lg:min-h-0 lg:grid-cols-1 lg:gap-2 lg:[grid-auto-rows:minmax(min-content,1fr)]">
          <StatCard
            label="Storage"
            action={<Skeleton className="h-6 w-24" />}
            value={<Bone className="h-5 w-20" />}
            bar={{ percent: 0, tone: "bg-transparent" }}
            detail={<Bone className="h-3 w-48" />}
            footerIcon={HardDrive}
            footer={<Bone className="h-3 w-32" />}
          />
          <StatCard
            label="Next backup"
            value={<Bone className="h-5 w-28" />}
            detail={<Bone className="h-3 w-44" />}
            footerIcon={Repeat}
            footer={<Bone className="h-3 w-36" />}
          />
          <StatCard
            label="Data at risk"
            value={<Bone className="h-5 w-24" />}
            detail={<Bone className="h-3 w-48" />}
            footerIcon={Hourglass}
            footer={<Bone className="h-3 w-32" />}
          />
          <StatCard
            label="Backups"
            value={<Bone className="h-5 w-20" />}
            detail={<Bone className="h-3 w-40" />}
            footerIcon={History}
            footer={<Bone className="h-3 w-28" />}
          />
        </div>
      </div>
    </div>
  )
}

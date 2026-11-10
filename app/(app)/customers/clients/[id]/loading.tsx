import { Skeleton } from "@/components/ui/skeleton"

/**
 * A client while it loads — added 2026-11-09. The back button and title, the
 * answers on the left and the applications table on the right, as on the page.
 */

const SECTIONS = ["Home", "Income", "Loan and credit"]

const COLUMNS = ["Lead ID", "Status", "Brand", "Channel", "Amount", "Result", "Created"]

const SUB_HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

export default function ClientLoading() {
  return (
    <div
      className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3 lg:overflow-hidden"
      role="status"
      aria-label="Loading"
    >
      <div className="flex flex-col gap-1" aria-hidden>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5" />
          <Skeleton className="h-6 w-32" />
        </div>
        <Skeleton className="h-3 w-24" />
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1" aria-hidden>
        <section className="shrink-0 card-shell rounded-lg border bg-muted/40 p-0.5">
          <h2 className={`${SUB_HEAD} px-3 py-2`}>Personal info</h2>
          <div className="flex flex-col rounded-md border bg-card lg:flex-row">
            <div className="flex items-center gap-3 p-4 lg:w-[calc(22.375rem_-_2.5px)] lg:shrink-0 lg:border-r">
              <Skeleton className="size-12 shrink-0 rounded-xl" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <div className="grid flex-1 grid-cols-2 content-center gap-x-6 gap-y-3 border-t p-4 sm:grid-cols-3 lg:grid-cols-5 lg:border-t-0">
              {Array.from({ length: 5 }, (_, item) => (
                <div key={item} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <section className="flex flex-col card-shell rounded-lg border bg-muted/40 p-0.5 lg:min-h-0">
            <h2 className={`${SUB_HEAD} px-3 py-2`}>Income and loan</h2>
            <div className="flex flex-col gap-5 overflow-hidden rounded-md border bg-card p-4 lg:min-h-0 lg:flex-1">
              {SECTIONS.map((title) => (
                <div key={title}>
                  <h3 className={`${SUB_HEAD} mb-2`}>{title}</h3>
                  <div className="flex flex-col divide-y">
                    {Array.from({ length: 4 }, (_, line) => (
                      <div key={line} className="flex h-7 items-center justify-between gap-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col card-shell rounded-lg border bg-muted/40 p-0.5 lg:min-h-0">
            <div className="flex items-center gap-2 px-3 py-1.5">
              <h2 className={SUB_HEAD}>Applications</h2>
              <div className="ml-auto flex gap-1.5">
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-7 w-24 rounded-md" />
                <Skeleton className="h-7 w-24 rounded-md" />
              </div>
            </div>
            <div className="overflow-hidden rounded-md border bg-card lg:min-h-0 lg:flex-1">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {COLUMNS.map((label, index) => (
                      <th
                        key={label}
                        className={`${SUB_HEAD} h-10 px-2 text-left ${index === 0 ? "pl-4" : ""} ${label === "Amount" ? "text-center" : ""}`}
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: 3 }, (_, row) => (
                    <tr key={row} className="border-b">
                      <td className="p-2 pl-4">
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="p-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="p-2">
                        <Skeleton className="size-4 rounded-sm" />
                      </td>
                      <td className="p-2">
                        <Skeleton className="h-3.5 w-14" />
                      </td>
                      <td className="p-2">
                        <Skeleton className="mx-auto h-3.5 w-14" />
                      </td>
                      <td className="p-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="p-2 pr-4">
                        <Skeleton className="h-3 w-28" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1.5">
              <Skeleton className="ml-1 h-3 w-28" />
              <Skeleton className="h-6 w-36 rounded-md" />
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

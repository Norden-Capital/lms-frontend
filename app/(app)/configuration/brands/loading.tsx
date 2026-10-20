import { PageHeader } from "@/components/layout/pageHeader"
import { Panel } from "@/components/system/panel"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Brands while they load — decided 2026-10-20. The same header, panel and
 * table as the real page, with grey shapes for the rows, so nothing moves when
 * the brands arrive.
 */

const HEAD =
  "py-2 text-left font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

export default function BrandsLoading() {
  return (
    <div
      className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3"
      role="status"
      aria-label="Loading"
    >
      <PageHeader
        title="Brands"
        description="Your brand emails. Mail comes in and replies go out from them."
      />

      <Panel
        title="Brands"
        action={
          // The website box and the add button, at their real sizes.
          <div className="flex items-center gap-2" aria-hidden>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="size-7" />
          </div>
        }
        bodyClassName="p-0"
      >
        <table className="w-full border-collapse text-sm" aria-hidden>
          <thead>
            <tr className="border-b">
              <th className={`${HEAD} pl-4`}>Brand</th>
              <th className={HEAD}>Email address</th>
              <th className={HEAD}>Website</th>
              <th className={HEAD}>Replies</th>
              <th className={HEAD}>Added</th>
              <th className={HEAD}>Active</th>
              <th className={`${HEAD} pr-4 text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }, (_, index) => (
              <tr key={index} className="border-b last:border-b-0">
                <td className="py-2.5 pl-4">
                  <span className="flex items-center gap-2.5">
                    <Skeleton className="size-7 shrink-0" />
                    <Skeleton className="h-4 w-28" />
                  </span>
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-44" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-32" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-6 w-24" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-3 w-32" />
                </td>
                <td className="py-2.5">
                  <Skeleton className="h-4 w-7 rounded-full" />
                </td>
                <td className="py-2.5 pr-4">
                  <span className="flex items-center justify-end gap-1">
                    <Skeleton className="size-5.5" />
                    <Skeleton className="size-5.5" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  )
}

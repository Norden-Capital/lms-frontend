import { Skeleton } from "@/components/ui/skeleton"

/**
 * The backup log's grey rows — decided 2026-10-20. Laid out on the log's own
 * column widths, at the height of a real run: the time on two lines, the
 * status, the size, how long, and the two row buttons. Used by the page's first
 * load and laid over the rows while a sort, page or page size loads.
 */

const WIDTHS = ["24%", "18%", "18%", "19%", "21%"]

function BackupRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <table className="w-full table-fixed border-collapse" aria-hidden>
      <colgroup>
        {WIDTHS.map((width, index) => (
          <col key={index} style={{ width }} />
        ))}
      </colgroup>
      <tbody>
        {Array.from({ length: rows }, (_, index) => (
          <tr key={index} className="border-b last:border-b-0">
            <td className="py-2.5 pl-4">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="mt-1.5 h-3 w-16" />
            </td>
            <td className="px-3 py-2.5">
              <Skeleton className="h-3.5 w-20" />
            </td>
            <td className="px-3 py-2.5">
              <Skeleton className="ml-auto h-3.5 w-14" />
            </td>
            <td className="px-3 py-2.5">
              <Skeleton className="ml-auto h-3.5 w-10" />
            </td>
            <td className="py-2.5 pr-4">
              <span className="flex justify-end gap-1">
                <Skeleton className="size-5.5" />
                <Skeleton className="size-5.5" />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export { BackupRowsSkeleton }

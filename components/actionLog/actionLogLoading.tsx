import { Skeleton } from "@/components/ui/skeleton"

/**
 * The action log's grey rows — decided 2026-10-20. The height of real lines:
 * a tick box, when, what, who, to whom, details, address. Used by the page's
 * first load and laid over the rows while a search, sort or page loads.
 */
function ActionLogRowsSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="flex flex-col" aria-hidden>
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-12 items-center gap-6 border-b pr-4 pl-4">
          <Skeleton className="size-4 shrink-0 rounded-[4px]" />
          <Skeleton className="h-3 w-32 shrink-0" />
          <span className="flex w-36 shrink-0 items-center gap-2">
            <Skeleton className="size-1.5 shrink-0 rounded-full" />
            <Skeleton className="h-3.5 w-28" />
          </span>
          <Skeleton className="h-3.5 w-28 shrink-0" />
          <Skeleton className="h-3.5 w-28 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-full max-w-72" />
            <Skeleton className="h-3 w-2/3 max-w-48" />
          </span>
          <Skeleton className="h-3 w-24 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export { ActionLogRowsSkeleton }

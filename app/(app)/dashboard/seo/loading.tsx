import { SeoSkeleton } from "@/components/seo/seoWorkspace"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The SEO Overview while it first loads — the title, the filter row (brand on
 * the left, period on the right), then grey shapes in the page's own grid.
 * Inside the layout's frame, so nothing moves when the figures arrive.
 */
export default function SeoLoading() {
  return (
    <div className="flex flex-col gap-4" role="status" aria-label="Loading">
      <div className="flex flex-col gap-2" aria-hidden>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-3 w-64" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3" aria-hidden>
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-36" />
        </div>
      </div>
      <SeoSkeleton />
    </div>
  )
}

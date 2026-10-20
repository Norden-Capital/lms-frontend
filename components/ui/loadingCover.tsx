import { cn } from "@/lib/utils"

/**
 * Laid over the part of a page that is loading — decided 2026-10-20. Absolute,
 * so it takes no room of its own and nothing moves; the wrapper it sits in must
 * be `relative`. Grey shapes go inside it, the size of the real content.
 *
 * <p>Covers the whole wrapper by default. A `className` can move one edge — a
 * table passes `top-10` so its headings stay in sight — or change the fill.
 */
function LoadingCover({
  show,
  className,
  children,
}: {
  show: boolean
  className?: string
  children: React.ReactNode
}) {
  if (!show) return null
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "absolute inset-x-0 top-0 bottom-0 z-20 overflow-hidden bg-background",
        className
      )}
    >
      {children}
    </div>
  )
}

export { LoadingCover }

import { cn } from "@/lib/utils"

/**
 * Shared layout for every error screen (404, 403, 401, 500). Kept presentational
 * and directive-free so both server pages (`not-found`) and client error
 * boundaries (`error`, `global-error`) can render it.
 */
function ErrorState({
  code,
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  code: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center gap-5 p-6",
        className
      )}
    >
      {/* Smaller text, bigger icon — decided 2026-10-20. The code keeps its size. */}
      <div className="flex max-w-xs flex-col items-center gap-2.5 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-muted">
          <Icon className="size-8" />
        </span>
        <span className="font-mono text-xs font-bold tracking-widest text-muted-foreground tabular-nums">
          {code}
        </span>
        <h1 className="font-heading text-lg font-semibold tracking-tight text-balance">
          {title}
        </h1>
        <p className="text-xs text-muted-foreground text-balance">
          {description}
        </p>
      </div>

      {children && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      )}
    </div>
  )
}

export { ErrorState }

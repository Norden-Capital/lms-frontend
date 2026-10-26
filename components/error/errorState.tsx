import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
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
  size = "sm",
  iconFrame,
  children,
}: {
  code: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  className?: string
  /**
   * "sm" everywhere since 2026-10-26: the error pages and the messages inside
   * the app now share one size. "default" is the older, bigger one.
   */
  size?: "default" | "sm"
  /**
   * "button": the icon in the header buttons' square frame (outline, glass) —
   * decided 2026-10-26, now on every page that uses this. "round" is the
   * older circle, kept for the bigger size only.
   */
  iconFrame?: "round" | "button"
  children?: React.ReactNode
}) {
  const small = size === "sm"
  const frame = iconFrame ?? (small ? "button" : "round")

  return (
    <div
      className={cn(
        "flex min-h-svh flex-col items-center justify-center p-6",
        small ? "gap-4" : "gap-5",
        className
      )}
    >
      {/* Smaller text, bigger icon — decided 2026-10-20. The code keeps its size. */}
      <div className={cn("flex max-w-xs flex-col items-center text-center", small ? "gap-2" : "gap-2.5")}>
        <span
          className={cn(
            "flex items-center justify-center",
            frame === "button"
              ? "relative overflow-hidden rounded-lg border bg-muted"
              : "rounded-full bg-muted",
            small ? "size-11" : "size-16"
          )}
        >
          {frame === "button" && <LiquidGlassLayers />}
          <Icon className={cn("relative", small ? "size-5" : "size-8")} />
        </span>
        <span
          className={cn(
            "font-mono font-bold tracking-widest text-muted-foreground tabular-nums",
            small ? "text-[0.65rem]" : "text-xs"
          )}
        >
          {code}
        </span>
        <h1 className={cn("font-heading font-semibold tracking-tight text-balance", small ? "text-sm" : "text-lg")}>
          {title}
        </h1>
        <p className={cn("text-muted-foreground text-balance", small ? "text-[0.7rem]" : "text-xs")}>
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

import Link from "next/link"
import { ArrowLeft } from "lucide-react"

/**
 * The icon-title-sentence block every auth screen opens with, plus the way back
 * to sign-in. Shared by the invitation and reset pages, valid link or not.
 */
function LinkHeader({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="mb-1 flex size-9 items-center justify-center rounded-lg border bg-card shadow-sm">
        <Icon className="size-4" aria-hidden />
      </div>
      <h1 className="font-heading text-lg font-bold tracking-tight text-balance">{title}</h1>
      <p className="text-xs text-muted-foreground">{children}</p>
    </div>
  )
}

/** Not underlined, unlike the inline links — this is navigation, not prose. */
function BackToSignIn() {
  return (
    <p className="text-center text-xs">
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3" aria-hidden />
        Back to sign in
      </Link>
    </p>
  )
}

export { LinkHeader, BackToSignIn }

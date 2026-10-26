"use client"

import { useRef, useState, useSyncExternalStore } from "react"
import { Copy, TriangleAlert, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import { cn } from "@/lib/utils"

/**
 * Two things that make a brand silently fail, in one box under the table —
 * decided 2026-10-26. Neither is something this app can check.
 */
/**
 * The Google robot's email, for when the server cannot say it (not yet
 * deployed, or Google not connected). It is not a secret — it is an address.
 */
const ROBOT_EMAIL = "lms-analytics@norden-capital-lms.iam.gserviceaccount.com"

/**
 * Open or closed, remembered in this browser — decided 2026-10-26. Read with
 * useSyncExternalStore so the server draws it open and the browser switches to
 * what was saved without a second render pass. Another tab closing it updates
 * this one too.
 */
const STORAGE_KEY = "brand-warning"
const CHANGED = "brand-warning-change"

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CHANGED, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CHANGED, onChange)
  }
}

function readClosed() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "closed"
  } catch {
    return false
  }
}

function saveClosed(closed: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, closed ? "closed" : "open")
  } catch {
    // Storage blocked: it still opens and closes, just not remembered.
  }
  window.dispatchEvent(new Event(CHANGED))
}

/** How long the box takes to shrink into the corner before the bubble shows. */
const SHRINK_MS = 180

/**
 * The closed warning: a button like the header's (square, border, glass),
 * the icon in the warning colour — decided 2026-10-26. Magnetic: within its
 * area it leans toward the pointer, up to 6px, and springs back on leaving.
 * Off for anyone who asked their system for less motion.
 */
function WarningBubble({ onOpen }: { onOpen: () => void }) {
  const area = useRef<HTMLDivElement>(null)
  const [pull, setPull] = useState({ x: 0, y: 0 })

  function follow(event: React.PointerEvent<HTMLDivElement>) {
    const box = area.current?.getBoundingClientRect()
    if (!box) return
    const x = event.clientX - (box.left + box.width / 2)
    const y = event.clientY - (box.top + box.height / 2)
    // A third of the distance, never more than 6px either way.
    const clamp = (value: number) => Math.max(-6, Math.min(6, value / 3))
    setPull({ x: clamp(x), y: clamp(y) })
  }

  return (
    // The wider area is what pulls: the bubble moves before it is touched.
    <div
      ref={area}
      onPointerMove={follow}
      onPointerLeave={() => setPull({ x: 0, y: 0 })}
      className="-m-3 p-3"
    >
      <Button
        variant="outline"
        size="icon"
        onClick={onOpen}
        style={{ transform: `translate(${pull.x}px, ${pull.y}px)` }}
        className="relative overflow-hidden bg-card text-warning transition-transform duration-200 ease-out animate-in fade-in-0 zoom-in-50 motion-reduce:transform-none!"
        aria-label="Show: before a brand works"
        title="Before a brand works"
      >
        <LiquidGlassLayers />
        <TriangleAlert className="relative" aria-hidden />
      </Button>
    </div>
  )
}

function BrandWarnings({ robotEmail: fromServer }: { robotEmail: string | null }) {
  const robotEmail = fromServer ?? ROBOT_EMAIL
  const closed = useSyncExternalStore(subscribe, readClosed, () => false)
  // True while the box shrinks into the corner, before it becomes the bubble.
  const [leaving, setLeaving] = useState(false)

  function close() {
    setLeaving(true)
    window.setTimeout(() => {
      saveClosed(true)
      setLeaving(false)
    }, SHRINK_MS)
  }

  // Closed: the bubble at the very bottom right, to open it again.
  if (closed) {
    return (
      <div className="mt-auto flex shrink-0 justify-end">
        <WarningBubble onOpen={() => saveClosed(false)} />
      </div>
    )
  }

  function copy() {
    if (!robotEmail) return
    navigator.clipboard
      .writeText(robotEmail)
      .then(() => toast.success("Email copied."))
      .catch(() => toast.error("Could not copy. Select it instead."))
  }

  return (
    // mt-auto: at the very bottom of the page, however few brands there are.
    // Grows out of the bottom-right corner, where the bubble sits, and
    // shrinks back into it when closed.
    <div
      className={cn(
        "mt-auto flex w-full shrink-0 origin-bottom-right gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 duration-200",
        leaving
          ? "animate-out fade-out-0 zoom-out-50 fill-mode-forwards"
          : "animate-in fade-in-0 zoom-in-95"
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
        <p className="flex items-center justify-between gap-2 font-medium text-foreground">
          Before a brand works
          <button
            type="button"
            onClick={close}
            className="-my-1 -mr-1 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            aria-label="Close"
            title="Close"
          >
            <X className="size-3.5" />
          </button>
        </p>
        <ul className="mt-1 flex list-disc flex-col gap-1.5 pl-4">
          <li>
            <b>Google Analytics:</b> add this email as a <b>Viewer</b>{" "}in
            each brand&apos;s Google Analytics.
            If not, the SEO page shows nothing, even with the ID filled in.
            <button
              type="button"
              onClick={copy}
              className="mt-1.5 flex max-w-full items-center gap-1.5 rounded-sm border border-warning/30 bg-card px-2 py-1 font-mono text-[0.7rem] text-foreground transition-colors hover:bg-foreground/5"
              title="Copy"
            >
              <span className="truncate">{robotEmail}</span>
              <Copy className="size-3 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </li>
          <li>
            <b>Gmail:</b> add each brand&apos;s email in the inbox Gmail, under{" "}
            <b>Settings → Accounts → Send mail as</b>. If not, replies are sent from the Gmail address
            instead.
          </li>
        </ul>
      </div>
    </div>
  )
}

export { BrandWarnings }

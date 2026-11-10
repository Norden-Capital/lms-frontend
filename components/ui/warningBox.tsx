"use client"

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react"
import { TriangleAlert, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { LiquidGlassLayers } from "@/components/ui/liquidGlass"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/**
 * The yellow box at the foot of a page — first made for Brands on 2026-10-26,
 * shared on 2026-11-09 so Channels has the same one. It closes into a small
 * bubble in the corner, and each box remembers in this browser whether it was
 * closed.
 */

const CHANGED = "warning-box-change"

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CHANGED, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CHANGED, onChange)
  }
}

function saveClosed(storageKey: string, closed: boolean) {
  try {
    window.localStorage.setItem(storageKey, closed ? "closed" : "open")
  } catch {
    // Storage blocked: it still opens and closes, just not remembered.
  }
  window.dispatchEvent(new Event(CHANGED))
}

/** How long the box takes to shrink into the corner before the bubble shows. */
const SHRINK_MS = 180

/**
 * The closed box: a button like the header's (square, border, glass), the icon
 * in the warning colour. Magnetic: within its area it leans toward the pointer,
 * up to 6px, and springs back on leaving. Off for anyone who asked their system
 * for less motion.
 */
function WarningBubble({ title, onOpen }: { title: string; onOpen: () => void }) {
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
    <div ref={area} onPointerMove={follow} onPointerLeave={() => setPull({ x: 0, y: 0 })} className="-m-3 p-3">
      <Button
        variant="outline"
        size="icon"
        onClick={onOpen}
        style={{ transform: `translate(${pull.x}px, ${pull.y}px)` }}
        className="relative overflow-hidden bg-card text-warning transition-transform duration-200 ease-out animate-in fade-in-0 zoom-in-50 motion-reduce:transform-none!"
        aria-label={`Show: ${title}`}
        title={title}
      >
        <LiquidGlassLayers />
        <TriangleAlert className="relative" aria-hidden />
      </Button>
    </div>
  )
}

/**
 * Holds the box or the bubble, and grows or shrinks to fit whichever shows —
 * added 2026-11-09, so the table above slides instead of jumping when the box
 * opens or closes. The transition starts after the first paint, so a box that
 * was closed earlier does not animate shut on load.
 */
function AnimatedHeight({ children }: { children: React.ReactNode }) {
  const inner = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | null>(null)
  const [ready, setReady] = useState(false)

  useLayoutEffect(() => {
    const element = inner.current
    if (!element) return
    // Fires once on observe, then on every change of size.
    const observer = new ResizeObserver(() => setHeight(element.offsetHeight))
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      // -mt-3: half the page's gap between the table and the box.
      className={cn(
        "-mt-3 shrink-0",
        ready && "transition-[height] duration-300 ease-out motion-reduce:transition-none"
      )}
      // Clipped while it changes size, with room for the bubble's pull.
      style={{ height: height ?? undefined, overflow: "clip", overflowClipMargin: 12 }}
    >
      <div ref={inner}>{children}</div>
    </div>
  )
}

/** Whether this box was closed in this browser. */
function useClosed(storageKey: string) {
  return useSyncExternalStore(
    subscribe,
    () => {
      try {
        return window.localStorage.getItem(storageKey) === "closed"
      } catch {
        return false
      }
    },
    () => false
  )
}

/**
 * The box while its page loads, in the shape it will have: the small bubble if
 * it was closed, the box at its real height (`className`) if not. Added
 * 2026-11-09 so the page does not jump when it arrives.
 */
function WarningSkeleton({ storageKey, className }: { storageKey: string; className: string }) {
  const closed = useClosed(storageKey)
  if (closed) {
    return (
      <div className="-mt-3 flex shrink-0 justify-end" aria-hidden>
        <Skeleton className="size-8 rounded-md" />
      </div>
    )
  }
  return <Skeleton className={cn("-mt-3 shrink-0 rounded-md", className)} aria-hidden />
}

function WarningBox({
  storageKey,
  title,
  children,
}: {
  /** Where this box's open or closed state is kept. One per box. */
  storageKey: string
  title: string
  children: React.ReactNode
}) {
  const closed = useClosed(storageKey)
  // True while the box shrinks into the corner, before it becomes the bubble.
  const [leaving, setLeaving] = useState(false)

  function close() {
    setLeaving(true)
    window.setTimeout(() => {
      saveClosed(storageKey, true)
      setLeaving(false)
    }, SHRINK_MS)
  }

  // Closed: the bubble at the very bottom right, to open it again.
  return (
    <AnimatedHeight>
      {closed ? (
        <div className="flex justify-end">
          <WarningBubble title={title} onOpen={() => saveClosed(storageKey, false)} />
        </div>
      ) : (
        <OpenBox title={title} leaving={leaving} onClose={close}>
          {children}
        </OpenBox>
      )}
    </AnimatedHeight>
  )
}

/** The open box: the icon, the title with its close button, and the text. */
function OpenBox({
  title,
  leaving,
  onClose,
  children,
}: {
  title: string
  leaving: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    // Grows out of the bottom-right corner, where the bubble sits, and
    // shrinks back into it when closed.
    <div
      className={cn(
        "flex w-full origin-bottom-right gap-3 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 duration-200",
        leaving ? "animate-out fade-out-0 zoom-out-50 fill-mode-forwards" : "animate-in fade-in-0 zoom-in-95"
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground [&_b]:font-medium [&_b]:text-foreground">
        <p className="flex items-center justify-between gap-2 font-medium text-foreground">
          {title}
          <button
            type="button"
            onClick={onClose}
            className="-my-1 -mr-1 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"
            aria-label="Close"
            title="Close"
          >
            <X className="size-3.5" />
          </button>
        </p>
        {children}
      </div>
    </div>
  )
}

export { WarningBox, WarningSkeleton }

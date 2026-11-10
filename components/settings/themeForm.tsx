"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { Check, Moon, RotateCcw, Sun } from "lucide-react"
import { toast } from "sonner"

import { saveAppearance } from "@/app/(app)/settings/theme/actions"
import { Panel } from "@/components/system/panel"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import {
  FONTS,
  PALETTES,
  RADII,
  STANDARD_APPEARANCE,
  applyAppearance,
  sameAppearance,
  type Appearance,
  type Mode,
  type Palette,
} from "@/lib/appearance"
import { cn } from "@/lib/utils"

/** One choice in a group. The picked one gets a blue ring and a tick. */
function Choice({
  checked,
  onSelect,
  className,
  children,
}: {
  checked: boolean
  onSelect: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "relative flex flex-col rounded-md border bg-card text-left text-sm transition-colors outline-none hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50",
        checked && "border-info ring-1 ring-info",
        className
      )}
    >
      {children}
      {checked && (
        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-info text-white">
          <Check className="size-3" aria-hidden />
        </span>
      )}
    </button>
  )
}

/**
 * A tiny app in grey blocks (sidebar, header, two cards, a chart row), drawn
 * in the chosen colors and forced to light or dark — like tweakcn's picker.
 */
function ModePreview({ palette, mode }: { palette: Palette; mode: Mode }) {
  return (
    <span
      data-palette={palette}
      data-mode={mode}
      style={{ colorScheme: mode }}
      className="flex h-28 overflow-hidden rounded-sm border bg-background"
      aria-hidden
    >
      <span className="flex w-1/4 flex-col gap-1.5 border-r bg-sidebar p-1.5">
        <span className="h-2 w-full rounded-[3px] bg-sidebar-primary" />
        <span className="h-1.5 w-4/5 rounded-full bg-sidebar-foreground/20" />
        <span className="h-1.5 w-3/5 rounded-full bg-sidebar-foreground/20" />
        <span className="h-1.5 w-4/5 rounded-full bg-sidebar-foreground/20" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1.5 p-1.5">
        <span className="h-2 w-2/5 rounded-full bg-foreground/70" />
        <span className="grid flex-1 grid-cols-2 gap-1.5">
          {[0, 1].map((card) => (
            <span key={card} className="flex flex-col gap-1 rounded-[3px] border bg-card p-1.5">
              <span className="h-1.5 w-3/4 rounded-full bg-muted-foreground/40" />
              <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/25" />
              <span className="mt-auto flex items-end gap-0.5">
                {(["h-2 bg-chart-1", "h-3 bg-chart-2", "h-1.5 bg-chart-3", "h-2.5 bg-chart-4"] as const).map((bar) => (
                  <span key={bar} className={cn("w-1.5 rounded-[1px]", bar)} />
                ))}
              </span>
            </span>
          ))}
        </span>
        <span className="h-2.5 w-1/3 rounded-[3px] bg-primary" />
      </span>
    </span>
  )
}

const MODES: { id: Mode; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
]

/**
 * Settings → Theme (added 2026-11-10). Every change shows on the whole app at
 * once, as a preview. Save keeps it on your account; Discard or leaving the
 * page puts your saved look back.
 */
export function ThemeForm({ saved }: { saved: Appearance }) {
  const [draft, setDraft] = useState(saved)
  const [kept, setKept] = useState(saved)
  const [pending, startTransition] = useTransition()
  const keptRef = useRef(saved)

  // A new saved look from the server (another tab, or after a save).
  const [lastSaved, setLastSaved] = useState(saved)
  if (!sameAppearance(lastSaved, saved)) {
    setLastSaved(saved)
    setKept(saved)
    setDraft(saved)
  }

  useEffect(() => {
    keptRef.current = kept
  }, [kept])

  // Preview: the whole app follows the draft.
  useEffect(() => {
    applyAppearance(draft)
  }, [draft])

  // Leaving without saving puts the saved look back.
  useEffect(() => () => applyAppearance(keptRef.current), [])

  const changed = !sameAppearance(draft, kept)
  const isStandard = sameAppearance(draft, STANDARD_APPEARANCE)
  const set = (part: Partial<Appearance>) => setDraft((current) => ({ ...current, ...part }))

  function save() {
    startTransition(async () => {
      const result = await saveAppearance(draft)
      if (result.ok) {
        setKept(draft)
        keptRef.current = draft
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-medium">Theme</h2>
          <p className="text-sm text-muted-foreground">
            {changed ? "You have changes. Save to keep them." : "How the app looks for you."}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button
            variant="ghost"
            onClick={() => setDraft(STANDARD_APPEARANCE)}
            disabled={isStandard || pending}
            className="flex-1 sm:flex-none"
          >
            <RotateCcw aria-hidden />
            Default
          </Button>
          <Button
            variant="outline"
            onClick={() => setDraft(kept)}
            disabled={!changed || pending}
            className="flex-1 sm:flex-none"
          >
            Discard
          </Button>
          <Button onClick={save} disabled={!changed || pending} className="flex-1 sm:flex-none">
            {pending ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="grid shrink-0 gap-6 lg:grid-cols-2">
        <Panel title="Mode" className="shrink-0">
          <div role="radiogroup" aria-label="Mode" className="grid grid-cols-2 gap-3">
            {MODES.map(({ id, label, icon: Icon }) => (
              <Choice key={id} checked={draft.mode === id} onSelect={() => set({ mode: id })} className="gap-2 p-1.5">
                <ModePreview palette={draft.palette} mode={id} />
                <span className="flex items-center gap-1.5 px-1 pb-0.5 text-xs font-medium">
                  <Icon className="size-3.5 text-muted-foreground" aria-hidden />
                  {label}
                </span>
              </Choice>
            ))}
          </div>
        </Panel>

        <Panel title="Corners" className="shrink-0" bodyClassName="justify-center">
          <div role="radiogroup" aria-label="Corners" className="grid grid-cols-5 gap-2">
            {RADII.map(({ id, label, rem }) => (
              <Choice
                key={id}
                checked={draft.radius === id}
                onSelect={() => set({ radius: id })}
                className="items-center gap-2 px-1 py-3"
              >
                <span
                  className="size-7 border-t-2 border-l-2 border-foreground/70"
                  style={{ borderTopLeftRadius: `${rem * 1.4}rem` }}
                  aria-hidden
                />
                <span className="text-xs">{label}</span>
              </Choice>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Colors" className="shrink-0">
        <div
          role="radiogroup"
          aria-label="Colors"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
        >
          {PALETTES.map(({ id, label }) => (
            <Choice key={id} checked={draft.palette === id} onSelect={() => set({ palette: id })} className="p-1.5">
              {/* A small copy of the app in this palette: page, card, button and chart colors. */}
              <span data-palette={id} className="flex flex-col gap-1.5 rounded-sm border bg-background p-2" aria-hidden>
                <span className="flex flex-col gap-1 rounded-sm border bg-card p-1.5">
                  <span className="h-1.5 w-2/3 rounded-full bg-foreground/80" />
                  <span className="h-1.5 w-1/2 rounded-full bg-muted-foreground/50" />
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-3 w-8 rounded-sm bg-primary" />
                  {(["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4"] as const).map((color) => (
                    <span key={color} className={cn("size-2.5 rounded-full", color)} />
                  ))}
                </span>
              </span>
              <span className="truncate px-1 pt-1.5 pb-0.5 text-xs font-medium">{label}</span>
            </Choice>
          ))}
        </div>
      </Panel>

      <Panel title="Font" className="shrink-0">
        <div role="radiogroup" aria-label="Font" className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {FONTS.map(({ id, label, cssVar }) => (
            <Choice
              key={id}
              checked={draft.font === id}
              onSelect={() => set({ font: id })}
              className="items-center gap-1 px-1 py-3"
            >
              <span className="text-xl" style={{ fontFamily: `var(${cssVar})` }} aria-hidden>
                Aa
              </span>
              <span className="max-w-full truncate text-xs" style={{ fontFamily: `var(${cssVar})` }}>
                {label}
              </span>
            </Choice>
          ))}
        </div>
      </Panel>

      <Panel title="Cards" className="shrink-0">
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span className="min-w-0">
            <span className="block text-sm font-medium">Outer card</span>
            <span className="block text-sm text-muted-foreground">The grey frame around each card.</span>
          </span>
          <Switch checked={draft.cardFrame} onCheckedChange={(on) => set({ cardFrame: on })} />
        </label>
      </Panel>
    </div>
  )
}

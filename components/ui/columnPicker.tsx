"use client"

import { useMemo, useState, useSyncExternalStore } from "react"
import { Funnel } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/** Sent on this tab when a choice is saved; "storage" only fires on other tabs. */
const CHANGED = "lms-columns-changed"

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange)
  window.addEventListener(CHANGED, onChange)
  return () => {
    window.removeEventListener("storage", onChange)
    window.removeEventListener(CHANGED, onChange)
  }
}

function parse(text: string, fallback: string[]): Set<string> {
  try {
    const value: unknown = JSON.parse(text)
    return new Set(Array.isArray(value) ? value.map(String) : fallback)
  } catch {
    return new Set(fallback)
  }
}

/**
 * Which columns a table hides, kept in this browser. `storageKey` names the
 * table, so each one remembers its own. Read after the first paint, since the
 * server cannot see this browser's storage.
 */
function useHiddenColumns(storageKey: string, hiddenByDefault: string[]) {
  const fallback = JSON.stringify(hiddenByDefault)
  // Kept in memory too, so a choice still works when storage is blocked.
  const [unsaved, setUnsaved] = useState<string | null>(null)
  const stored = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return localStorage.getItem(storageKey) ?? fallback
      } catch {
        return fallback
      }
    },
    () => fallback
  )
  const hidden = useMemo(() => parse(unsaved ?? stored, hiddenByDefault), [unsaved, stored, hiddenByDefault])

  function save(next: Set<string>) {
    const text = JSON.stringify([...next])
    try {
      localStorage.setItem(storageKey, text)
      window.dispatchEvent(new Event(CHANGED))
    } catch {
      // Storage blocked: the choice lasts until the page closes.
      setUnsaved(text)
    }
  }

  function toggle(id: string) {
    const next = new Set(hidden)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    save(next)
  }

  function reset() {
    save(new Set(hiddenByDefault))
  }

  return { hidden, toggle, reset }
}

/** The filter button: tick the columns to show. One always stays, so the table is never empty. */
function ColumnPicker({
  columns,
  hidden,
  onToggle,
  onReset,
}: {
  columns: { id: string; label: string }[]
  hidden: Set<string>
  onToggle: (id: string) => void
  onReset: () => void
}) {
  const shown = columns.filter((column) => !hidden.has(column.id)).length

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuTrigger
              render={<Button variant="outline" size="icon-sm" className="bg-card" aria-label="Show or hide columns" />}
            />
          }
        >
          <Funnel />
        </TooltipTrigger>
        <TooltipContent>Columns</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="max-h-96 min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Show columns</DropdownMenuLabel>
          {columns.map((column) => {
            const visible = !hidden.has(column.id)
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visible}
                disabled={visible && shown === 1}
                closeOnClick={false}
                onCheckedChange={() => onToggle(column.id)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onReset}>Reset</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ColumnPicker, useHiddenColumns }

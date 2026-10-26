"use client"

import { useState, useTransition } from "react"
import { ChevronDown, ChevronsUpDown, ChevronUp, LogOut, Monitor, MonitorX, Smartphone } from "lucide-react"
import { toast } from "sonner"

import { endOtherSessions, endSession } from "@/app/(app)/settings/security/actions"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TablePagination } from "@/components/ui/tablePagination"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { torontoStamp } from "@/lib/format"
import type { MySession } from "@/lib/me"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { deviceName, isMobile } from "@/lib/userAgent"
import { cn } from "@/lib/utils"

/**
 * Where you are signed in — added 2026-10-26, as a table built like a user's
 * Activity table: sortable columns, ten lines a page. This device is marked
 * and has no sign-out button (that is what Log out is for).
 */

const HEAD = "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"
const STICKY_HEAD = "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"
const PAGE_SIZE = 10

type SortKey = "device" | "ip" | "seen" | "at"

const COLUMNS: { key: SortKey; label: string; className?: string }[] = [
  { key: "device", label: "Device", className: "pl-4" },
  { key: "ip", label: "Address" },
  { key: "seen", label: "Last used" },
  { key: "at", label: "Signed in" },
]

/** "Active now" within five minutes, else when it was last used. */
function lastUsed(iso: string) {
  return Date.now() - new Date(iso).getTime() < 5 * 60_000 ? "Active now" : torontoStamp(iso)
}

function SessionsList({ sessions }: { sessions: MySession[] }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "seen", desc: true })
  const [page, setPage] = useState(1)
  const [pending, start] = useTransition()

  const value = (s: MySession) =>
    sort.key === "device"
      ? deviceName(s.userAgent)
      : sort.key === "ip"
        ? (s.ip ?? "")
        : sort.key === "seen"
          ? s.lastSeenAt
          : s.createdAt
  const sorted = [...sessions].sort((a, b) => {
    const order = value(a).localeCompare(value(b))
    return sort.desc ? -order : order
  })

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const current = Math.min(page, totalPages)
  const shown = sorted.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  function toggle(key: SortKey) {
    // A new column starts newest/A first for dates, A first otherwise; the same column flips.
    setSort((now) => (now.key === key ? { key, desc: !now.desc } : { key, desc: key === "seen" || key === "at" }))
    setPage(1)
  }

  function signOut(id: string) {
    start(async () => {
      const result = await endSession(id)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

  if (sessions.length === 0) {
    return (
      <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
        No sessions to show.
      </p>
    )
  }

  return (
    <div className="flex min-h-0 flex-col">
      <Table containerClassName={cn("min-h-0 overflow-auto", THIN_SCROLLBAR)}>
        <TableHeader className="[&_tr]:border-b-0">
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map(({ key, label, className }) => {
              const active = sort.key === key
              const Icon = !active ? ChevronsUpDown : sort.desc ? ChevronDown : ChevronUp
              return (
                <TableHead
                  key={key}
                  className={cn(HEAD, STICKY_HEAD, className)}
                  aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                >
                  <button
                    type="button"
                    onClick={() => toggle(key)}
                    className={cn(
                      "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                      active && "text-foreground"
                    )}
                  >
                    {label}
                    <Icon className={cn("size-3", active ? "opacity-100" : "opacity-40")} aria-hidden />
                  </button>
                </TableHead>
              )
            })}
            {/* The sign-out button's column: no heading. */}
            <TableHead className={cn(STICKY_HEAD, "w-10 pr-4")} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map((session) => {
            const Icon = isMobile(session.userAgent) ? Smartphone : Monitor
            return (
              <TableRow key={session.id}>
                <TableCell className="pl-4 whitespace-nowrap">
                  <span className="flex items-center gap-2 text-sm text-foreground">
                    <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    {deviceName(session.userAgent)}
                    {session.current && (
                      <span className="shrink-0 rounded-md bg-info/10 px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wider text-info uppercase">
                        This device
                      </span>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {session.ip ?? "—"}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {lastUsed(session.lastSeenAt)}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {torontoStamp(session.createdAt)}
                </TableCell>
                <TableCell className="w-10 pr-4 text-right">
                  {!session.current && (
                    <Tooltip>
                      <TooltipTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={pending}
                            onClick={() => signOut(session.id)}
                            aria-label="Sign out this session"
                          />
                        }
                      >
                        <LogOut />
                      </TooltipTrigger>
                      <TooltipContent>Sign out</TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 pt-2 text-[0.7rem] text-muted-foreground">
        <p className="tabular-nums">
          {`Showing ${(current - 1) * PAGE_SIZE + 1}–${(current - 1) * PAGE_SIZE + shown.length} of ${sorted.length}`}
        </p>
        <TablePagination page={current} totalPages={totalPages} onPage={setPage} />
      </div>
    </div>
  )
}

/** The question's button: sign out everywhere but here. */
function EndOtherSessionsButton({ disabled = false }: { disabled?: boolean }) {
  const [pending, start] = useTransition()

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-md bg-card"
      disabled={disabled || pending}
      onClick={() =>
        start(async () => {
          const result = await endOtherSessions()
          if (result.ok) toast.success(result.message)
          else toast.error(result.message)
        })
      }
    >
      <MonitorX data-icon="inline-start" />
      Sign out everywhere else
    </Button>
  )
}

export { SessionsList, EndOtherSessionsButton }

import type { Metadata } from "next"

import {
  BackUpNowButton,
  RefreshWhileRunning,
  ReloadButton,
} from "@/components/backups/backupActions"
import { BackupLog } from "@/components/backups/backupLog"
import { BackupSummary } from "@/components/backups/backupSummary"
import { BackupYear } from "@/components/backups/backupYear"
import { PageHeader } from "@/components/layout/pageHeader"
import { requireUser } from "@/lib/auth"
import { getBackupStatus } from "@/lib/backups"
import type { BackupQuery } from "@/lib/backupTypes"

export const metadata: Metadata = {
  title: "Backups",
}

/**
 * Copies of the database, and whether they can be trusted.
 *
 * <p>Real since 2026-10-20: the backend copies the database every night at
 * 03:00 Toronto time, checks the copy, and keeps it on the server and in Cloudflare R2 —
 * see the backend's BackupService. Nothing is deleted automatically.
 *
 * <p>Three panels, in the order the questions get asked:
 *
 * <ul>
 *   <li><b>How exposed am I</b> — time since the last good backup, which is
 *       exactly how much work is lost if the machine dies now.</li>
 *   <li><b>Has this been reliable</b> — a year of squares, where a bad week is
 *       visible without reading anything.</li>
 *   <li><b>What went wrong</b> — the log, carrying the reason and not just the
 *       fact.</li>
 * </ul>
 *
 * <p>Restoring is deliberately not a button: putting an old copy back over the
 * live database is a job for the server, done by hand. Each copy is read back
 * (`pg_restore --list`) before it counts as a success.
 *
 * <p>The Owner only, via middleware's `OWNER_ONLY`; the backend refuses anybody
 * else too.
 */
export default async function BackupsPage({
  searchParams,
}: {
  /** The log's sort and the chart's year. Both write here and read from here. */
  searchParams: Promise<BackupQuery>
}) {
  await requireUser()

  const query = await searchParams

  // Decided once, on the server, and passed down. Components that read the clock
  // themselves render one answer here and a different one after hydration, which
  // React reports as a mismatch.
  const now = new Date()

  // Ordered by the backend, the same split the users list uses: the component
  // asks for a sort by writing it into the address bar, and the rows come back
  // already in that order.
  const result = await getBackupStatus(query)

  if (!result.ok) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5 p-4 sm:p-6">
        <PageHeader
          title="Backups"
          description="Copies of your data, kept safe."
        />
        <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error.message}
        </p>
      </div>
    )
  }

  const { status, log } = result.data

  const running = status.running

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-4 pb-3 sm:p-6 lg:overflow-hidden">
      <RefreshWhileRunning running={running} />

      <PageHeader
        title="Backups"
        description="Copies of your data, kept safe."
        actions={
          <div className="flex items-center gap-2">
            <BackUpNowButton running={running} />
            <ReloadButton />
          </div>
        }
      />

      {/* Two columns, not three rows. The left holds the history — the year
          above the log, both about the same thing at different zoom levels. The
          right holds the four single figures.

          A fixed 20rem for the cards rather than a share of the width, and the
          left column takes everything else. Proportional tracks were the first
          attempt: at 2fr/1fr the cards grew with the window, and on a wide screen
          four short readings sat in a column half again as wide as they needed
          while the five-column table beside them was the thing actually short of
          room. A single figure needs a fixed amount of space; a table will use
          whatever it is given. */}
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-4 lg:min-h-0">
          <BackupYear status={status} query={query} />
          {/* Keyed on the query, the same way the user list is. A new page of
              runs into the same element leaves the scrolling region exactly
              where it was, so moving to page 2 lands you halfway down it looking
              at rows you have not chosen. Remounting starts it at the top, which
              is where a new page begins. */}
          <BackupLog
            key={JSON.stringify(query)}
            log={log}
            now={now}
            query={query}
          />
        </div>

        <BackupSummary status={status} now={now} />
      </div>
    </div>
  )
}

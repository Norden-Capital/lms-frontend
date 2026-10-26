import { Donut } from "@/components/system/donut"
import { Panel } from "@/components/system/panel"
import { StatRow } from "@/components/system/statRow"
import { TablesCard } from "@/components/system/tablesCard"
import { HintedLabel } from "@/components/ui/hint"
import { bytes, count, duration, percent } from "@/lib/format"
import type { SystemHealth } from "@/lib/systemTypes"

/**
 * The PostgreSQL layer, from its own statistics views.
 *
 * <p>All live. `pg_stat_database`, `pg_stat_activity`, `pg_database_size` and
 * `pg_stat_user_tables` between them cover everything here except slow queries,
 * which needs the `pg_stat_statements` extension — and the card says so rather
 * than reporting a zero it did not measure.
 */
/** One line beside the ring: a name with its hint, and its value. */
function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-between gap-2">
      <HintedLabel label={label}>{hint}</HintedLabel>
      <span className="font-medium text-foreground tabular-nums">{children}</span>
    </span>
  )
}

function DatabasePanel({ health }: { health: SystemHealth }) {
  const { database, server } = health

  const shareOfDisk =
    server.diskTotal > 0 ? (database.onDiskBytes / server.diskTotal) * 100 : 0

  return (
    // The one tab that does NOT grow to fit its content, deliberately.
    //
    // Everything here is a fixed handful of rows except the tables card, which
    // is built to absorb whatever height is left over and scroll inside itself.
    // So a shorter window should squeeze that card, not start scrolling the tab
    // — one scrollbar in a known place beats the whole panel sliding about.
    //
    // `h-full` is what makes that happen: the grid is exactly the tab's height,
    // and the two columns below carry `min-h-0` so they may shrink past their
    // content — which is the permission the tables card needs to give up space.
    //
    // The safety net lives on the tables card itself rather than here, as a
    // minimum height it will not shrink past. A floor on this grid was the wrong
    // place for it: it made the whole tab scroll at window heights where the
    // table still had plenty of room left to give.
    <div className="grid gap-4 lg:h-full lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <div className="flex flex-col gap-4 lg:min-h-0">
        <Panel title="Storage" bodyClassName="gap-3">
          <StatRow
            label="Data"
            hint="Space your data takes."
            value={bytes(database.sizeBytes)}
          />
          <StatRow
            label="On disk"
            hint="All database files on the disk."
            value={bytes(database.onDiskBytes)}
          />
          <StatRow
            label="Write-ahead log"
            hint="A log of recent changes. Always growing is a problem."
            value={bytes(database.walBytes)}
          />
          <StatRow
            label="Share of disk"
            hint="Database size compared to the whole disk."
            value={percent(shareOfDisk, 2)}
            detail={`of ${bytes(server.diskTotal)}`}
            percent={shareOfDisk}
          />
        </Panel>

        <Panel
          title="Cache hit ratio"
          hint={
            <>
              How often data comes from fast memory. Below 99% can be slow.
            </>
          }
          className="lg:flex-1"
          bodyClassName="flex-row items-center gap-5"
        >
          {/* What it means on the left, the ring on the right — decided
              2026-10-26. */}
          <div className="flex min-w-0 flex-1 flex-col gap-1.5 border-r pr-5 text-xs text-muted-foreground">
            <Row label="From memory" hint="Fast. Read without touching the disk.">
              {percent(database.cacheHitRatio, 1)}
            </Row>
            <Row label="From disk" hint="Slow. Had to be read from the disk.">
              {percent(Math.max(0, 100 - database.cacheHitRatio), 1)}
            </Row>
            <Row label="Goal" hint="Below this, pages can feel slow.">
              99% or more
            </Row>
            <Row label="Status" hint="Good at the goal or above.">
              <span className={database.cacheHitRatio >= 99 ? "text-success" : "text-warning"}>
                {database.cacheHitRatio >= 99 ? "Good" : "Slow"}
              </span>
            </Row>
            <span className="my-1 border-t" aria-hidden />
            <Row label="Counted over" hint="Since the database last started.">
              {duration(database.uptimeSeconds)}
            </Row>
            <Row label="Database size" hint="All the data it holds.">
              {bytes(database.sizeBytes)}
            </Row>
          </div>
          <div className="size-32 shrink-0">
            <Donut
              percent={database.cacheHitRatio}
              label={percent(database.cacheHitRatio, 1)}
              sublabel="from memory"
            />
          </div>
        </Panel>
      </div>

      <div className="flex flex-col gap-4 lg:min-h-0">
        <Panel title="Activity" bodyClassName="gap-3">
          <StatRow
            // Deliberately not "active": the Backend tab uses that word for the
            // connections currently running a query, and this counts the idle
            // ones too. Two meanings of one word across two tabs is how a pool
            // sitting at its limit gets read as healthy.
            label="Open connections"
            hint="All open connections. At the limit, new ones fail."
            value={count(database.activeConnections)}
            detail={`of ${database.maxConnections}`}
            percent={
              database.maxConnections > 0
                ? (database.activeConnections / database.maxConnections) * 100
                : 0
            }
          />
          <StatRow
            label="Running queries"
            hint="Queries working right now."
            value={count(database.runningQueries)}
          />
          <StatRow
            label="Slow queries"
            hint="Queries that take over one second."
            value={database.slowQueriesAvailable ? "0" : "—"}
            detail={database.slowQueriesAvailable ? undefined : "not enabled"}
          />
          <StatRow
            label="Uptime"
            hint="Time since the database last started."
            value={duration(database.uptimeSeconds)}
          />
        </Panel>

        <TablesCard tables={database.tables} />
      </div>
    </div>
  )
}

export { DatabasePanel }

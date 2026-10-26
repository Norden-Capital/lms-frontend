import {
  Archive,
  CircleAlert,
  CircleCheck,
  Clock,
  History,
  Hourglass,
  Repeat,
} from "lucide-react"

import { Countdown, Elapsed } from "@/components/backups/liveClock"
import { StorageCard } from "@/components/backups/storageCard"
import { StatCard } from "@/components/stats/statCard"
import type { BackupStatus } from "@/lib/backupTypes"
import { formatCountdown, remaining } from "@/lib/countdown"
import { bytes, count, duration, torontoStamp } from "@/lib/format"

/**
 * The four figures worth putting beside the log.
 *
 * <p>Ordered storage, next backup, data at risk, backups kept — set deliberately
 * rather than by importance, so leave it alone unless somebody asks.
 *
 * <p><b>Note that "data at risk" is not first, and it is the one that matters
 * most.</b> Time since the last good backup <em>is</em> your exposure: exactly
 * how much work disappears if the machine dies while you are reading the screen.
 * "Next backup in 7 hours" merely restates a schedule somebody already chose,
 * and nothing follows from it. Data at risk is also the only tile here that goes
 * red, and — since a night where nothing ran leaves no row in the log — the only
 * thing anywhere on this page that notices a silently skipped backup.
 *
 * <p>So if the order is ever revisited, that is the tile with the argument for
 * the top spot.
 *
 * <p>Drawn with the application's own {@link StatCard} rather than a card
 * private to this screen. The local one had become a near-copy that would have
 * drifted the moment either was touched; the slots it needed — an icon, an
 * explanation, a colour, a bar, a control — moved into StatCard instead, where
 * the next screen wanting them will find them already there.
 */

/**
 * Past this, a nightly run has plainly been skipped and the tile says so.
 *
 * <p>Twenty-six hours, not thirty-six. On a daily schedule the age of the last
 * backup never legitimately passes twenty-four — it resets every night — so two
 * hours of grace flags a missed run almost as soon as it is missed. A looser
 * threshold stays green through a whole missed night and half the next day,
 * which is exactly the window in which somebody would have wanted to know.
 */
const OVERDUE_SECONDS = 26 * 60 * 60

function BackupSummary({
  status,
  now,
}: {
  status: BackupStatus
  /**
   * Passed in rather than read here.
   *
   * <p>This renders on the server and then hydrates in the browser. Reading the
   * clock in both places gives two different answers and React reports the
   * mismatch, so the moment is decided once, by the caller — and the two tiles
   * that need to keep moving hand off to a timer after the first frame.
   */
  now: Date
}) {
  const lastSuccess = status.lastSuccessAt ? new Date(status.lastSuccessAt) : null
  const sinceSeconds = lastSuccess
    ? Math.max(0, (now.getTime() - lastSuccess.getTime()) / 1000)
    : null

  const overdue = sinceSeconds === null || sinceSeconds > OVERDUE_SECONDS

  return (
    // A column beside the log rather than a band across the top. Two across on a
    // tablet, where a single column of four would be a very long scroll and the
    // log has no room to be useful anyway.
    //
    // `minmax(min-content, 1fr)` is load-bearing, and neither half is optional.
    //
    // `1fr` is what makes the four cards share the full height of the column
    // instead of huddling at the top. Plain `1fr` alone was the first attempt and
    // it clipped every card: grid rows will happily size below their contents, so
    // each card silently ate its own second line. `min-content` sets the floor at
    // "as tall as the text needs", so they stretch when there is room and refuse
    // to shrink when there is not — and the column scrolls in that case rather
    // than truncating.
    // gap-2 rather than the page's gap-4: four cards in one column pay the gap
    // three times, and those pixels are part of what keeps the set on screen.
    //
    // <b>No overflow rule, deliberately.</b> This column used to scroll when the
    // cards outgrew it, which is a reasonable default and the wrong one here:
    // four readings that exist to be taken in at a glance are not worth reading
    // if one of them is below the fold, and a scrollbar in a 20rem column beside
    // a table that also scrolls gives the page two of them arguing. The cards
    // were made small enough to fit instead.
    <div className="grid gap-4 sm:grid-cols-2 lg:h-full lg:min-h-0 lg:grid-cols-1 lg:gap-2 lg:[grid-auto-rows:minmax(min-content,1fr)]">
      <StorageCard status={status} />

      <StatCard
        icon={Clock}
        label="Next backup"
        hint={
          <>
            Time until the next backup starts.
          </>
        }
        value={
          status.nextRunAt ? (
            <Countdown
              targetIso={status.nextRunAt}
              initial={formatCountdown(remaining(status.nextRunAt, now.getTime()))}
            />
          ) : (
            "Not scheduled"
          )
        }
        detail={
          status.nextRunAt ? `Starts ${torontoStamp(status.nextRunAt)} Toronto time` : "No run scheduled"
        }
        footerIcon={Repeat}
        footer={status.schedule}
      />

      <StatCard
        icon={overdue ? CircleAlert : CircleCheck}
        label="Data at risk"
        hint={
          <>
            Time since the last good backup.
          </>
        }
        value={
          sinceSeconds === null || !status.lastSuccessAt ? (
            "Everything"
          ) : (
            <Elapsed
              sinceIso={status.lastSuccessAt}
              initial={duration(sinceSeconds)}
            />
          )
        }
        // Black while it is fine, red once it is not. Green said "good" every
        // hour of every day, which made the one colour on this card that means
        // anything the colour nobody was watching for. Now the card is silent
        // until there is something to say.
        tone={overdue ? "text-destructive" : "text-foreground"}
        detail={
          lastSuccess
            ? `Last good backup ${torontoStamp(lastSuccess.toISOString())} Toronto time`
            : "No good backup yet."
        }
        footerIcon={Hourglass}
        footer={`Overdue after ${OVERDUE_SECONDS / 3600} hours`}
      />

      <StatCard
        icon={Archive}
        label="Backups"
        hint={
          <>
            We keep every backup. Only you can delete one.
          </>
        }
        value={`${count(status.storedCount)} kept`}
        detail={`${bytes(status.storedBytes)} in ${status.destination}`}
        footerIcon={History}
        footer={`${count(status.totalRuns)} made in total`}
      />
    </div>
  )
}

export { BackupSummary }

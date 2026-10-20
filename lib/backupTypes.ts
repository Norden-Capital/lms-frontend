/**
 * The shape the Backups screen draws.
 *
 * <p>Client-safe on purpose, the same split as `userTypes` and `systemTypes`:
 * the components are shared between the server page and, later, whatever polls
 * for updates, and a file that reads the session cookie cannot be imported from
 * the browser.
 *
 * <p>The shape the backend's `GET /api/backups` returns — see BackupService.
 */

/**
 * What happened on a given day.
 *
 * <p>`missed` is deliberately its own state rather than a kind of failure. A
 * failure is loud — something ran, broke, and said so. A miss is silent: nothing
 * ran at all, because the machine was off or the schedule never fired. That is
 * the more dangerous of the two, and it appears only in the year counts, never
 * in the log — a list can show what happened, never what did not.
 *
 * <p>`running` is the only one that is not yet a verdict — it is a run in
 * progress, so it has a duration so far but no size and no destination. It is
 * also the only one that changes on its own while somebody is looking at it.
 */
export type BackupOutcome = "succeeded" | "failed" | "missed" | "running"

export type BackupRun = {
  id: string
  /** ISO timestamp the run started. */
  startedAt: string
  outcome: BackupOutcome
  /** Size of the finished file. Zero when the run never produced one. */
  sizeBytes: number
  durationSeconds: number
  /**
   * Where the file is now: "Server + Cloudflare R2", "Server", "Cloudflare R2",
   * or "Deleted". Null while running, and when it never got that far.
   */
  destination: string | null
  /**
   * Why it failed, in a sentence a person can act on.
   *
   * <p>"Failed" on its own is useless at two in the morning. "Saved on the
   * server, but the copy to Cloudflare R2 failed — SignatureDoesNotMatch" tells
   * you what to go and fix.
   */
  error: string | null
  /**
   * A file exists and can be downloaded.
   *
   * <p>The log keys Download and Delete off this rather than off the outcome:
   * a failed run whose cloud copy broke is still kept on the server, and a
   * deleted success has nothing behind it.
   */
  downloadable: boolean
  /** When the Owner deleted it. The row stays, so the history stays true. */
  deletedAt: string | null
  /** The nightly run, or "Back up now". */
  trigger: "scheduled" | "manual"
  /** Who pressed "Back up now". Null for the nightly run. */
  triggeredBy: string | null
  /** The copy was loaded into a scratch database and its data came back. */
  restoreTested: boolean
  /** What that test found — "Restored 12 tables, 345 rows". */
  restoreNote: string | null
}

/**
 * The columns of the log that can be ordered.
 *
 * <p>Named after the fields rather than the headings, because these strings end
 * up in the address bar and outlive whatever the column is called on screen.
 */
export type BackupSortKey =
  | "startedAt"
  | "outcome"
  | "sizeBytes"
  | "durationSeconds"

/**
 * What the address bar carries, and the only state the log has.
 *
 * <p>Same shape as `UserQuery`: `"sizeBytes,desc"` — the column and the
 * direction in one string. It lives in the URL rather than in the component so
 * the Back button undoes a sort and a sorted view can be sent to somebody.
 */
export type BackupQuery = {
  sort?: string
  /** Which year the chart is showing. Absent means the most recent one. */
  year?: string
  /** 1-based page of the log. */
  page?: string
  /** Rows a page. One of {@link LOG_PAGE_SIZES}. */
  size?: string
}

/**
 * Rows a page in the log.
 *
 * <p>Ten by default. The log sits in a panel of fixed height beside the summary
 * cards, so a page taller than the panel does not show more of anything — it
 * puts a scrollbar inside a scrollbar and makes the page numbers meaningless.
 * The larger two are for a screen with the room, not for scrolling further.
 */
export const LOG_PAGE_SIZES = [10, 25, 50] as const

export const DEFAULT_LOG_PAGE_SIZE = 10

/**
 * One page of the log, and enough about the rest to draw the controls.
 *
 * <p>Separate from {@link BackupStatus} on purpose. Everything in that is a fact
 * about the backups; this is a fact about what somebody is currently looking at,
 * and folding the two together is what makes a status object slowly become a
 * view model.
 */
export type BackupLogPage = {
  runs: BackupRun[]
  /** Every run the log holds, before paging. */
  total: number
  /** 1-based, and always within range — a page past the end comes back as the last. */
  page: number
  size: number
  totalPages: number
}

/** One square on the heatmap. `outcome: null` means before backups existed. */
export type BackupDay = {
  /** YYYY-MM-DD. */
  date: string
  outcome: BackupOutcome | null
}

export type BackupStatus = {
  /**
   * The last run that actually worked, or null if none ever has.
   *
   * <p>This — not the next run — is the number the page leads with. How long ago
   * it was is exactly how much work is currently at risk, and that is the only
   * figure on this screen anybody can act on.
   */
  lastSuccessAt: string | null
  nextRunAt: string | null
  /** The schedule in words, e.g. "Every day at 03:00". */
  schedule: string
  /**
   * Backups with a file still kept.
   *
   * <p>Nothing is deleted automatically — decided 2026-10-20 — so this only
   * falls below {@link totalRuns} when the Owner deletes one by hand.
   */
  storedCount: number
  storedBytes: number
  /** Every run that ever succeeded, including copies since deleted. */
  totalRuns: number
  /** "Server + Cloudflare R2", or "Server only" when R2 is not set up. */
  destination: string
  /**
   * The server disk the backups are written to — used and whole size.
   *
   * <p>Everything is kept, so this is the figure that one day runs out. The
   * R2 copy has its own 10 GB free allowance, far beyond what a small database
   * needs for years.
   */
  destinationUsedBytes: number
  destinationTotalBytes: number
  /** Oldest first, one per day from 1 January of the first year, for the heatmap. */
  days: BackupDay[]
  /** A backup is in progress right now — the page refreshes itself while it is. */
  running: boolean
  /** What the backups take on the server disk — part of destinationUsedBytes. */
  serverBackupBytes: number
  /** An R2 bucket is set up. */
  cloudConfigured: boolean
  /** What the backups take in Cloudflare R2. */
  cloudBackupBytes: number
  /** The R2 allowance the page measures against — the 10 GB free tier. */
  cloudLimitBytes: number
}

/**
 * The action log's shapes and words, shared by the page (server) and its
 * table (client). Mirrors the backend's ActionLogResponse and ActionType.
 */

/** Somebody in a log line: as they were named then, and their account now. */
export type LogParty = {
  label: string | null
  /** Null when the account no longer exists. */
  publicId: string | null
}

export type ActionLogEntry = {
  id: number
  /** ISO 8601. */
  at: string
  action: string
  actor: LogParty | null
  target: LogParty | null
  details: string | null
  ip: string | null
}

/** What the URL can carry. */
export type ActionLogQuery = {
  action?: string
  search?: string
  page?: string
  size?: string
  /** `field,direction` — see the backend's ActionLogService. */
  sort?: string
}

/** Rows per page — more than the users table, because the log is long. */
export const LOG_PAGE_SIZES = [10, 25, 50] as const

/** The page size in the URL, or 25 when it is missing or not one of the choices. */
export function logPageSize(size: string | undefined): number {
  const wanted = Number(size)
  return (LOG_PAGE_SIZES as readonly number[]).includes(wanted) ? wanted : 25
}

/** How each kind reads, and how serious it looks. */
export const ACTION_TYPES: Record<string, { label: string; tone: "neutral" | "good" | "warn" | "bad" }> = {
  USER_INVITED: { label: "User invited", tone: "neutral" },
  INVITATION_RESENT: { label: "Invitation resent", tone: "neutral" },
  INVITATION_ACCEPTED: { label: "Invitation accepted", tone: "good" },
  INVITATION_CANCELLED: { label: "Invitation cancelled", tone: "warn" },
  DETAILS_UPDATED: { label: "Details updated", tone: "neutral" },
  ROLE_CHANGED: { label: "Role changed", tone: "warn" },
  PERMISSIONS_CHANGED: { label: "Permissions changed", tone: "warn" },
  ACCOUNT_DEACTIVATED: { label: "Account deactivated", tone: "bad" },
  ACCOUNT_REACTIVATED: { label: "Account reactivated", tone: "good" },
  PASSWORD_RESET_SENT: { label: "Reset link sent", tone: "neutral" },
  PASSWORD_RESET_REQUESTED: { label: "Forgot password used", tone: "neutral" },
  PASSWORD_RESET_COMPLETED: { label: "Password changed", tone: "neutral" },
  TWO_FACTOR_ENABLED: { label: "Two-factor turned on", tone: "good" },
  TWO_FACTOR_RESET: { label: "Two-factor reset", tone: "warn" },
  RECOVERY_CODE_USED: { label: "Recovery code used", tone: "warn" },
  RECOVERY_CODES_REGENERATED: { label: "New recovery codes", tone: "neutral" },
  SIGN_IN: { label: "Signed in", tone: "neutral" },
  SIGN_IN_FAILED: { label: "Sign-in failed", tone: "warn" },
  ACCOUNT_LOCKED: { label: "Account locked", tone: "bad" },
  BACKUP_STARTED: { label: "Backup started", tone: "neutral" },
  BACKUP_DOWNLOADED: { label: "Backup downloaded", tone: "warn" },
  BACKUP_DELETED: { label: "Backup deleted", tone: "bad" },
}

export function actionLabel(action: string) {
  return ACTION_TYPES[action]?.label ?? action
}

/**
 * The backend's `UserStatus` enum in words, and the colour that goes with it.
 *
 * <p>The pill is gone but the colour is not. Those are two separate jobs: the
 * badge's shape was there to pick one row out of twelve in a table, which this
 * page has no need of — but green-for-active and red-for-suspended is how the
 * state is read at a glance, and it costs nothing on a bare word.
 *
 * <p>Tones match `statusBadge.tsx` exactly, so the same account does not look
 * amber in the table and grey here. Anything unrecognised falls through to the
 * raw name rather than vanishing.
 */
export const STATUS_TEXT: Record<string, { label: string; tone: string }> = {
  ACTIVE: { label: "Active", tone: "text-success" },
  PENDING_VERIFICATION: {
    label: "Invited, not joined yet",
    tone: "text-warning",
  },
  SUSPENDED: { label: "Suspended", tone: "text-destructive" },
  DEACTIVATED: { label: "Deactivated", tone: "text-muted-foreground" },
}

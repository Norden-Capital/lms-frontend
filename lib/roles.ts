/**
 * The role names the interface makes decisions on, and how each is shown.
 *
 * <p>The backend owns the rules; this only mirrors them so buttons the backend
 * would refuse are not offered in the first place.
 */

/** Exactly one account: the bootstrap one. Can deactivate administrators. */
export const OWNER = "OWNER"
export const ADMIN = "ADMIN"

/** OWNER → Owner, ADMIN → Administrator, anything else → Member. */
export function roleLabel(role: string): string {
  if (role === OWNER) return "Owner"
  if (role === ADMIN) return "Administrator"
  return "Member"
}

/** Holds every permission and may open Management: an administrator or the Owner. */
export function isPrivileged(role: string | undefined): boolean {
  return role === ADMIN || role === OWNER
}

/**
 * Roles somebody can be invited as or moved to. Never the Owner — there is one,
 * and the backend refuses to give the role to anybody else.
 */
export function isAssignable(role: string): boolean {
  return role !== OWNER
}

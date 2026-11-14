"use client"

import { createContext, useContext } from "react"

/**
 * What the signed-in account holds, for buttons inside a page. Added 2026-11-14
 * for the owner pages: an administrator may be given Backups but only read and
 * download, so Delete must not be drawn for them. Hiding is not what stops them
 * — the backend refuses the request.
 */
const Held = createContext<readonly string[]>([])

function HeldPermissions({ permissions, children }: { permissions: readonly string[]; children: React.ReactNode }) {
  return <Held value={permissions}>{children}</Held>
}

/** Whether the signed-in account holds this permission. */
function useHolds(permission: string): boolean {
  return useContext(Held).includes(permission)
}

export { HeldPermissions, useHolds }

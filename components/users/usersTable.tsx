"use client"

import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Ellipsis,
  Eye,
  FileJson,
  FileSpreadsheet,
  FileText,
  Info,
  KeyRound,
  KeySquare,
  Plus,
  Search,
  ShieldCheck,
  SquarePen,
  UserCog,
  UserX,
} from "lucide-react"

import {
  UserActionDialogs,
  canChangePermissions,
  canChangeRole,
  canManage,
  isInvited,
  type UserAction,
} from "@/components/users/userActionDialogs"
import { StatusBadge, TwoFactorBadge } from "@/components/users/statusBadge"
import { UserRowsSkeleton, useUsersLoading } from "@/components/users/usersLoading"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { LoadingCover } from "@/components/ui/loadingCover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DEFAULT_PAGE_SIZE,
  PAGE_SIZES,
  type Page,
  type UserQuery,
  type UserRow,
} from "@/lib/userTypes"
import { TablePagination } from "@/components/ui/tablePagination"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"
import { OWNER, roleLabel } from "@/lib/roles"
import { useAccess } from "@/components/access/accessProvider"

type SortKey =
  | "id"
  | "firstName"
  | "lastName"
  | "email"
  | "role"
  | "mfaEnabled"
  | "status"
  | "createdAt"

/**
 * Day, month, year — no time.
 *
 * <p>Fixed to `en-GB` rather than the visitor's locale, because this renders on
 * the server as well as in the browser and a component that formats differently
 * in each produces markup the two disagree about. Spelling the month out also
 * removes the 05/06 ambiguity a numeric date leaves behind.
 */
const JOINED = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
})

/**
 * Centred columns are the ones holding a token rather than prose: an identifier
 * and two badges, all of roughly fixed width. Left-aligning a pill leaves a
 * ragged gap down the column, while names and emails vary in length and have to
 * start from a common edge to be scannable.
 */
// Every column left-aligned — decided 2026-10-19. One edge for the eye to
// follow down the table, instead of some columns centred and some not.
const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "id", label: "ID" },
  { key: "firstName", label: "First name" },
  { key: "lastName", label: "Last name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role" },
  { key: "mfaEnabled", label: "2FA" },
  { key: "status", label: "Status" },
  // Last of the data columns, beside Actions. It is the one the list is sorted
  // by out of the box, and a table ordered by something it does not show looks
  // arbitrarily shuffled.
  { key: "createdAt", label: "Joined" },
]

/**
 * Column headings in the same letter-spaced mono as the stat cards, which is
 * what ties the two halves of this page together.
 */
const HEAD =
  "font-mono text-[0.7rem] font-medium tracking-wider text-muted-foreground uppercase"

/**
 * Pins the headings while the rows move under them.
 *
 * <p>On the cells rather than on `<thead>`: `position: sticky` is not reliable on
 * a table section, and with `border-collapse: collapse` — which Tailwind's
 * preflight sets — a border on a stuck element scrolls off with the row it was
 * collapsed against. The inset shadow is a border that belongs to the cell
 * itself, so it stays put.
 *
 * <p>An opaque background is not optional here. Without it the rows show
 * straight through the headings as they pass.
 */
const STICKY_HEAD =
  "sticky top-0 z-10 bg-card shadow-[inset_0_-1px_0_var(--border)]"

/**
 * One row's menu, and the dialogs it can open.
 *
 * <p>Its own component so each row holds its own dialog state. Kept up in the
 * table, a single `deactivating` flag would have to remember *which* row asked,
 * and every row would re-render whenever any menu opened.
 *
 * <p>The dialog is a sibling of the menu rather than inside it. Choosing a menu
 * item closes the menu and unmounts its contents, so a dialog nested in there
 * would vanish in the same frame it appeared.
 */
function UserRowActions({ user }: { user: UserRow }) {
  const [action, setAction] = useState<UserAction>(null)
  const { viewerIsOwner } = useAccess()
  // Administrators manage members; only the Owner manages administrators.
  // An administrator looking at another administrator's row can only view it.
  const manage = canManage(user, viewerIsOwner)
  const role = canChangeRole(user, viewerIsOwner)
  const permissions = manage && canChangePermissions(user)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon-sm"
              className="bg-card"
              aria-label={`Actions for ${user.firstName} ${user.lastName}`}
            />
          }
        >
          <Ellipsis />
        </DropdownMenuTrigger>

        {/* Wide enough that "Reset two-factor" stays on one line — left to
            itself the menu shrinks to its trigger and wraps every label longer
            than two words.

            Grouped by what the action touches: reading the account, changing
            what it may do, changing how it gets in. The destructive item is last
            and alone, well away from where the pointer rests after opening.

            Items the backend would refuse are left out, not greyed out. */}
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            {/* A link, not an onClick: it goes somewhere, so it should be
                openable in a new tab and show its destination on hover like
                anything else that navigates. */}
            <DropdownMenuItem render={<Link href={`/users/${user.id}`} />}>
              <Eye data-icon="inline-start" />
              View details
            </DropdownMenuItem>
            {/* Never for the Owner: made at setup, its details are fixed. */}
            {manage && user.role !== OWNER && (
              <DropdownMenuItem render={<Link href={`/users/${user.id}?edit=1`} />}>
                <SquarePen data-icon="inline-start" />
                Edit details
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>

          {(role || permissions) && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>Access</DropdownMenuLabel>
                {role && (
                  <DropdownMenuItem onClick={() => setAction("role")}>
                    <UserCog data-icon="inline-start" />
                    Change role
                  </DropdownMenuItem>
                )}
                {/* A link, not a dialog. Choosing among twelve permissions needs
                    the whole picker, which is a screen — and `?user=` is what tells
                    that screen whose permissions it is showing. */}
                {permissions && (
                  <DropdownMenuItem
                    render={<Link href={`/users/${user.id}/permissions`} />}
                  >
                    <KeySquare data-icon="inline-start" />
                    Change permissions
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </>
          )}

          {manage && (
            <>
              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>Security</DropdownMenuLabel>
                {/* Both of these get somebody back in when they are locked out —
                    one for a forgotten password (by email), one for a lost phone.
                    Someone invited but not joined gets their invitation again. */}
                <DropdownMenuItem onClick={() => setAction("password")}>
                  <KeyRound data-icon="inline-start" />
                  {isInvited(user) ? "Resend invitation" : "Send reset link"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAction("twoFactor")}>
                  <ShieldCheck data-icon="inline-start" />
                  Reset two-factor
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant={user.status === "ACTIVE" || isInvited(user) ? "destructive" : undefined}
                  onClick={() => setAction("deactivate")}
                >
                  <UserX data-icon="inline-start" />
                  {user.status === "ACTIVE"
                    ? "Deactivate"
                    : isInvited(user)
                      ? "Cancel invitation"
                      : "Turn back on"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <UserActionDialogs
        user={user}
        action={action}
        onClose={() => setAction(null)}
      />
    </>
  )
}

/**
 * Whether a click landed on something with its own job inside a row — the
 * checkbox, the actions menu, a link — rather than on the row itself. Those
 * must not also open the person's page.
 */
function isInsideControl(target: EventTarget) {
  return (
    target instanceof Element &&
    target.closest("button, a, input, label, [role='checkbox'], [role='menuitem'], [role='menu']") !== null
  )
}

/**
 * Everyone with an account.
 *
 * <p>Client-side because of selection, the row menus, and writing to the address
 * bar. The rows themselves arrive as a prop from the page, which fetched them on
 * the server — so no token reaches the browser and the list is in the first
 * paint rather than after a spinner.
 *
 * <p><b>Search, sort and paging live in the URL, not in state.</b> They used to
 * run in memory here, which was right at a dozen invented users and wrong at a
 * thousand real ones: every row had to be fetched before any of them could be
 * hidden. Now each of them is a query parameter the server acts on, which also
 * makes a filtered, sorted page three something you can send to a colleague and
 * something the Back button restores.
 */
function UsersTable({
  page,
  query,
}: {
  /** One page of results, already filtered and sorted by the database. */
  page: Page<UserRow>
  /** What the address bar currently says. The single source of truth. */
  query: UserQuery
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  // The wait for the server after a search, sort or page — shared with the
  // filter button up in the header, which changes the same list.
  const { navigate, loading } = useUsersLoading()

  // Selection is per page and deliberately not in the URL: it is a scratch
  // decision about rows on screen, not a place you would want to link somebody
  // to. Changing page clears it, which is the honest behaviour — "select all"
  // never silently held onto people you had scrolled past.
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [sortKey, sortDir] = (query.sort ?? "").split(",")
  const pageSize = Number(query.size) || DEFAULT_PAGE_SIZE
  const currentPage = page.page + 1
  const pageCount = Math.max(1, page.totalPages)
  const rows = page.content
  const hasFilters = Boolean(query.role || query.status || query.mfa)
  const searching = Boolean(query.search)

  /**
   * Writes one parameter and reloads from the server.
   *
   * <p>Any change except the page number sends you back to page one. Page 4 of
   * an unfiltered list is rarely page 4 of a filtered one, and landing on an
   * empty page after narrowing a search looks like the search broke.
   */
  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString())

    if (value === null || value === "") next.delete(key)
    else next.set(key, value)

    if (key !== "page") next.delete("page")

    setSelected(new Set())
    navigate(`${pathname}?${next.toString()}`)
  }

  /**
   * What is in the search box right now, which is ahead of the URL.
   *
   * <p>Typing has to feel immediate, but each change is a request to the server —
   * so the field keeps its own value and the URL catches up once the typing
   * stops. Without this, "cherkaoui" is eleven round trips and the results
   * flicker through ten wrong answers on the way to the right one.
   *
   * <p>Re-seeded from the URL by the key on this component in the page, so
   * pressing Back actually empties the box rather than leaving a stale word in
   * a field that is no longer filtering anything.
   */
  const [typed, setTyped] = useState(query.search ?? "")
  const debounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const current = query.search ?? ""
    if (typed === current) return

    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => setParam("search", typed || null), 350)

    return () => clearTimeout(debounce.current)
    // setParam is recreated every render and would restart the timer on each
    // keystroke, which is the one thing this must not do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typed, query.search])

  /**
   * Where a download points.
   *
   * <p>Carries the filters, so "export" means "export the list I am looking at"
   * rather than "export everything and find it again in Excel". Paging is left
   * out on purpose — exporting page 2 of something is nobody's intention.
   *
   * <p>Ticked rows narrow it further. That is the only thing the checkboxes do:
   * they were sitting there counting a selection that nothing acted on.
   */
  function exportHref(format: "csv" | "json" | "xlsx") {
    const next = new URLSearchParams()
    next.set("format", format)

    for (const key of ["search", "role", "status", "mfa", "sort"] as const) {
      const value = params.get(key)
      if (value) next.set(key, value)
    }

    if (selected.size > 0) next.set("ids", [...selected].join(","))

    return `/api/export/users?${next.toString()}`
  }

  function toggleSort(key: SortKey) {
    const nextDir = sortKey === key && sortDir !== "desc" ? "desc" : "asc"
    // A new column starts ascending. Carrying the previous direction over means
    // clicking a fresh heading can sort it backwards for no visible reason.
    setParam("sort", `${key},${nextDir}`)
  }

  function toggleAll(checked: boolean) {
    const next = new Set(selected)
    // Only the rows currently on screen, so a filtered "select all" cannot
    // quietly pick up people the person searching never saw.
    rows.forEach((u) => (checked ? next.add(u.id) : next.delete(u.id)))
    setSelected(next)
  }

  function toggleOne(id: string, checked: boolean) {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    setSelected(next)
  }

  const allVisibleSelected =
    rows.length > 0 && rows.every((u) => selected.has(u.id))

  return (
    // Same nesting as the stat cards above, at the same 2px inset — repeating
    // the shape is what makes the page read as one surface rather than a row of
    // cards followed by an unrelated slab.
    //
    // min-h-0 so this can be the thing that scrolls: a flex child defaults to
    // min-height:auto and would otherwise push the page taller instead of
    // scrolling inside itself.
    <div className="flex min-h-0 flex-1 flex-col rounded-md border bg-muted/40 p-0.5">
      {/* ── Toolbar ────────────────────────────────────────────────────────
          On the tinted shell, outside the white panel. It is chrome for the
          table rather than a row of it, and sitting on the outer surface says
          so — the same way the stat cards keep their footnote out there.

          Every control is 32px so the row has one baseline: the search field
          sets it, and the button and menu match rather than stepping down. */}
      <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-2">
        <p className={cn(HEAD, "mr-auto flex items-center gap-1.5 pl-2")}>
          {selected.size > 0 ? `${selected.size} selected` : "All users"}
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  // A button, not a bare icon: a tooltip that only appears on
                  // hover is unreachable by keyboard and invisible on a phone.
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="About this table"
                />
              }
            >
              <Info className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent className="max-w-64">
              Everyone with an account. Users with 2FA off can&apos;t use the app
              yet. Tick rows to export only those.
            </TooltipContent>
          </Tooltip>
        </p>

        <div className="relative">
          <Search
            className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          {/* No fill: it sits on the tinted shell and borrows it, which is what
              keeps the toolbar reading as one surface rather than three panels
              in a row. */}
          <Input
            type="search"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Search users..."
            aria-label="Search users"
            className="h-8 w-56 rounded-md bg-transparent pl-8"
          />
        </div>

        <Button className="rounded-md" render={<Link href="/users/new" />}>
          <Plus data-icon="inline-start" />
          Invite user
        </Button>

        {/* How many rows fit on a page. Sits with the other controls rather than
            down by the page numbers: it decides what the table shows, which is
            the same job as the search beside it. */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                className="rounded-md bg-transparent font-normal"
                aria-label={`Rows per page: ${pageSize}`}
              />
            }
          >
            {pageSize} rows
            <ChevronDown data-icon="inline-end" className="opacity-60" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-32">
            <DropdownMenuRadioGroup
              value={String(pageSize)}
              // setParam already returns to page one, which is what this needs:
              // page 4 of a 5-row list does not exist once the list shows 15.
              onValueChange={(value) => setParam("size", value)}
            >
              {PAGE_SIZES.map((size) => (
                <DropdownMenuRadioItem key={size} value={String(size)}>
                  {size} rows
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="outline"
                size="icon-sm"
                // The theme's square corners, like every other button — decided
                // 2026-10-26 (it was round). Smaller than the two beside it: it
                // holds the rarely-used exports, so it is lighter than Add user.
                className="bg-card"
                aria-label="More options"
              />
            }
          >
            <Ellipsis />
          </DropdownMenuTrigger>
          {/* Links, not buttons. A download is a navigation: the browser owns
              the save dialog and the progress, and nothing has to be held in
              memory as a blob on the way. */}
          <DropdownMenuContent align="end" className="min-w-52">
            {/* Wrapped in a group because the label needs one: Base UI reads its
                heading from MenuGroupContext, and a bare label throws rather than
                rendering plainly. */}
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                {selected.size > 0
                  ? `Export ${selected.size} selected`
                  : `Export ${page.totalElements} ${page.totalElements === 1 ? "row" : "rows"}`}
              </DropdownMenuLabel>

              <DropdownMenuItem render={<a href={exportHref("csv")} download />}>
                <FileText data-icon="inline-start" />
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem render={<a href={exportHref("json")} download />}>
                <FileJson data-icon="inline-start" />
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem render={<a href={exportHref("xlsx")} download />}>
                <FileSpreadsheet data-icon="inline-start" />
                Excel
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* relative: the loader covers the rows only, under the headings, so the
          search box and the buttons above stay usable — decided 2026-10-20. */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-sm border bg-card">
        <LoadingCover show={loading} className="top-10 bg-card">
          <UserRowsSkeleton />
        </LoadingCover>
        {/* The scroll lives on the table's own container, reached through
            containerClassName. Wrapping it in another scrolling div does not
            work: that wrapper stays between the header and the outer element, so
            the header pins itself to a box that only scrolls sideways and slides
            away as soon as you scroll down. */}
        <Table
          containerClassName={cn("min-h-0 flex-1 overflow-auto", THIN_SCROLLBAR)}
          // Only when empty. A table cell is vertically centred by default, so
          // stretching the table to its container is all it takes to put the
          // message in the middle of the space rather than tucked under the
          // headings. With rows present this would stretch them instead.
          className={cn(rows.length === 0 && "h-full")}
        >
            {/* The row's own border is dropped: with border-collapse a border on
                a sticky element scrolls away with the content it was collapsed
                against, leaving the heading floating. STICKY_HEAD draws it as an
                inset shadow on each cell instead, which travels with them. */}
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="hover:bg-transparent">
                <TableHead className={cn(STICKY_HEAD, "w-10 pl-4")}>
                  <Checkbox
                    checked={allVisibleSelected}
                    onCheckedChange={toggleAll}
                    aria-label="Select all users"
                  />
                </TableHead>

                {COLUMNS.map(({ key, label }) => {
                  const active = sortKey === key
                  const Icon = !active
                    ? ChevronsUpDown
                    : sortDir === "desc"
                      ? ChevronDown
                      : ChevronUp

                  return (
                    <TableHead
                      key={key}
                      className={cn(HEAD, STICKY_HEAD)}
                      // On the header cell, not the button: aria-sort describes
                      // the column, and a button has no such state to report.
                      aria-sort={
                        active
                          ? sortDir === "desc"
                            ? "descending"
                            : "ascending"
                          : "none"
                      }
                    >
                      {/* A real button, so the column is reachable by keyboard
                          rather than being a div that happens to respond to
                          clicks. */}
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className={cn(
                          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
                          // The column the table is actually ordered by, in the
                          // full-strength text. It used to be marked only by the
                          // arrow swapping shape at 12px, which is far too quiet
                          // for the thing explaining why the rows are in the
                          // order they are in — a list sorted by size has its
                          // dates apparently scrambled, and nothing said why.
                          active && "text-foreground"
                        )}
                      >
                        {label}
                        <Icon
                          className={cn("size-3", active ? "opacity-100" : "opacity-40")}
                          aria-hidden
                        />
                      </button>
                    </TableHead>
                  )
                })}

                <TableHead className={cn(HEAD, STICKY_HEAD, "w-16 pr-4 text-right")}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={COLUMNS.length + 2}
                    className="text-center align-middle text-sm text-muted-foreground"
                  >
                    {searching
                      ? `No users match "${query.search}".`
                      : hasFilters
                        ? "No users match these filters."
                        : "No users yet."}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((user) => (
                  <TableRow
                    key={user.id}
                    data-state={selected.has(user.id) ? "selected" : undefined}
                    // The whole row opens the person's page — decided 2026-10-19.
                    // Clicks on the checkbox, the actions menu or anything else
                    // interactive inside the row keep doing their own thing.
                    onClick={(event) => {
                      // A dialog opened from this row's menu is drawn elsewhere
                      // on the page, but React still passes its clicks up to
                      // the row. Only clicks physically inside the row count.
                      if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) return
                      if (isInsideControl(event.target)) return
                      router.push(`/users/${user.id}`)
                    }}
                    onMouseEnter={() => router.prefetch(`/users/${user.id}`)}
                    // Deactivated accounts dim rather than disappear: they still
                    // hold the email address, so hiding them means the same
                    // person cannot be found when they come back.
                    className={cn(
                      "cursor-pointer",
                      user.status === "DEACTIVATED" && "opacity-55"
                    )}
                  >
                    <TableCell className="pl-4">
                      <Checkbox
                        checked={selected.has(user.id)}
                        onCheckedChange={(checked) => toggleOne(user.id, checked)}
                        aria-label={`Select ${user.firstName} ${user.lastName}`}
                      />
                    </TableCell>

                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {user.id}
                    </TableCell>

                    <TableCell className="font-medium">{user.firstName}</TableCell>
                    <TableCell className="font-medium">{user.lastName}</TableCell>

                    <TableCell className="text-muted-foreground">
                      {user.email}
                    </TableCell>

                    <TableCell className="text-xs whitespace-nowrap">
                      {roleLabel(user.role)}
                    </TableCell>

                    <TableCell>
                      <TwoFactorBadge enabled={user.mfaEnabled} />
                    </TableCell>

                    <TableCell>
                      <StatusBadge status={user.status} />
                    </TableCell>

                    <TableCell className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                      {user.createdAt ? JOINED.format(new Date(user.createdAt)) : "—"}
                    </TableCell>

                    <TableCell className="pr-4 text-right">
                      <UserRowActions user={user} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
        </Table>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────
          On the tinted shell below the card, mirroring the toolbar above it —
          both are chrome for the table rather than part of it, and keeping them
          on the same surface frames the rows between them.

          Outside the scrolling region too, so the controls stay put while the
          rows move. */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 px-3 py-1.5 text-[0.7rem] text-muted-foreground">
        <p className="pl-1 tabular-nums">
          {page.totalElements === 0
            ? "No results"
            : `Showing ${page.page * pageSize + 1}–${page.page * pageSize + rows.length} of ${page.totalElements}`}
        </p>

        <TablePagination
          page={currentPage}
          totalPages={pageCount}
          onPage={(next) => setParam("page", String(next))}
        />
      </div>
    </div>
  )
}

export { UsersTable, type UserRow }

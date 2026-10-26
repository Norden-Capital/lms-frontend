import {
  DatabaseBackup,
  HardDrive,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Settings,
  SlidersHorizontal,
  UserCog,
  Users,
} from "lucide-react"

export type NavSubItem = {
  title: string
  href: string
}

export type NavItem = {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Present on items that expand into a sub-list. */
  items?: NavSubItem[]
}

export type NavSection = {
  title: string
  items: NavItem[]
  /**
   * Only shown to administrators.
   *
   * <p>Not a nicety. Every route under Management is admin-only in the database,
   * so a member following this link gets a 403 — and a menu entry that always
   * refuses is worse than no entry: it reads as something they are supposed to
   * have and cannot, rather than something that was never theirs.
   *
   * <p>Hiding it is not what stops them. Middleware refuses the route and the
   * backend refuses the request; this only decides what to draw.
   */
  adminOnly?: boolean
  /** Drawn for the Owner and nobody else — see the Platform section. */
  ownerOnly?: boolean
}

/**
 * The scrolling part of the sidebar.
 *
 * Overview points at /dashboard rather than /overview because that is the one
 * route in here that actually exists — and its children nest under it, so the
 * prefix match lights the parent up when a child is open. Everything else
 * resolves to the 404 page until built.
 */
export const navSections: NavSection[] = [
  {
    title: "Main Menu",
    items: [
      {
        title: "Overview",
        href: "/dashboard",
        icon: LayoutDashboard,
        items: [
          // Order decided 2026-10-20: SEO, email, then paid ads. Leads on top
          // since 2026-10-26 — the page everyone lands on after signing in.
          { title: "Leads Overview", href: "/dashboard/leads" },
          { title: "SEO Overview", href: "/dashboard/seo" },
          { title: "Email Overview", href: "/dashboard/email" },
          { title: "Paid Ads Overview", href: "/dashboard/paid-ads" },
        ],
      },
    ],
  },
  {
    title: "Customers",
    items: [
      // Three lists — decided 2026-10-26: people who asked, people who
      // started and stopped, people who signed. Coming soon for now.
      {
        title: "Customer List",
        href: "/customers",
        icon: Users,
        items: [
          { title: "Leads", href: "/customers/leads" },
          { title: "Abandoned", href: "/customers/abandoned" },
          { title: "Customers", href: "/customers/list" },
        ],
      },
    ],
  },
  {
    title: "Management",
    adminOnly: true,
    items: [
      { title: "Users", href: "/users", icon: UserCog },
      // Roles & Permissions used to sit here and no longer does. The screen
      // still exists at /roles-permissions, but changing somebody's permissions
      // only makes sense once you have said whose — so it is reached by
      // "Change permissions" on an account, which carries the person in the URL,
      // rather than by a link that arrives with nobody selected.
    ],
  },
  {
    // The Owner's alone — decided 2026-10-19. What happened on the platform
    // and the machine it runs on are not things administrators see.
    title: "Platform",
    ownerOnly: true,
    items: [
      // Order decided 2026-10-20: set it up, watch it, keep it safe, look back.
      {
        title: "Configuration",
        href: "/configuration",
        icon: SlidersHorizontal,
        items: [{ title: "Brands", href: "/configuration/brands" }],
      },
      { title: "System Health", href: "/system-health", icon: HardDrive },
      { title: "Backups", href: "/backups", icon: DatabaseBackup },
      { title: "Action Log", href: "/action-log", icon: ScrollText },
    ],
  },
]

/**
 * Pinned to the bottom of the sidebar, below the scrolling nav — it stays put
 * however long the menu above it gets. The log out button is rendered
 * alongside these in the sidebar rather than listed here, since it submits an
 * action rather than navigating.
 */
export const settingsSection: NavSection = {
  title: "Settings",
  items: [
    { title: "Help Center", href: "/help-center", icon: LifeBuoy },
    // Its pages listed under it, like Configuration — decided 2026-10-26.
    // isNavItemActive matches by prefix, so it stays lit anywhere under /settings.
    {
      title: "System Settings",
      href: "/settings",
      icon: Settings,
      items: [
        { title: "Dashboard", href: "/settings/dashboard" },
        { title: "Security", href: "/settings/security" },
        { title: "Notifications", href: "/settings/notifications" },
      ],
    },
  ],
}

/**
 * Longest-prefix match, so a nested route like /customers/42 still lights up
 * Customer List. Exact-only would leave the sidebar with nothing active there.
 */
export function isNavItemActive(href: string, pathname: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

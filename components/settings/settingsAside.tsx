"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, ChevronDown, LayoutDashboard, LayoutGrid, Mail, Phone, ShieldCheck } from "lucide-react"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Fact, Unknown } from "@/components/users/userDetail"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TruncatedText } from "@/components/ui/truncatedText"
import type { SessionUser } from "@/lib/auth"
import { initialsOf } from "@/lib/initials"
import { THIN_SCROLLBAR } from "@/lib/scrollbar"
import { cn } from "@/lib/utils"

/**
 * Your own account down the left of Settings — decided 2026-10-26, the user
 * details page's column: who you are and how to reach you, then the menu.
 * The page you are on has a blue bar. Everything else about your account is
 * on My dashboard.
 */

// Order decided 2026-10-26: the page you land on, then you, then how you
// sign in, then what you hear about. No Help Center here — the main sidebar
// already has it.
const PAGES = [
  { title: "My dashboard", href: "/settings/dashboard", icon: LayoutDashboard },
  { title: "Security", href: "/settings/security", icon: ShieldCheck },
  // Not built yet, and says so in the menu.
  { title: "Notifications", href: "/settings/notifications", icon: Bell, soon: true },
]

/**
 * One page in the menu — decided 2026-10-26, from the example the Owner
 * picked: a thin line runs down the left of the group, and the open page
 * lights its stretch of it in blue. Tags (like Coming soon) sit on the right.
 */
function PageLink({
  href,
  icon: Icon,
  active = false,
  soon = false,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
  /** A small "Coming soon" tag on the right. */
  soon?: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-9 items-center gap-2.5 pl-4 text-sm transition-colors",
        // The blue bar sits over the group's grey line, on this row only.
        "before:absolute before:inset-y-1 before:-left-px before:w-[3px] before:rounded-full before:transition-colors",
        active
          ? "font-medium text-foreground before:bg-info"
          : "text-muted-foreground before:bg-transparent hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{children}</span>
      {soon && (
        <span className="ml-auto shrink-0 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
          Coming soon
        </span>
      )}
    </Link>
  )
}

function SettingsAside({ user }: { user: SessionUser }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex w-full shrink-0 flex-col gap-3 lg:w-70 lg:min-h-0 lg:overflow-y-auto lg:border-r lg:pr-6",
        THIN_SCROLLBAR
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-12 rounded-xl after:rounded-xl">
          <AvatarFallback className="rounded-xl text-sm font-medium">
            {initialsOf(user.firstName, user.lastName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-col">
          <p className="truncate font-heading text-base font-semibold tracking-tight">
            {user.firstName} {user.lastName}
          </p>
          <p className="font-mono text-xs text-muted-foreground">{user.id}</p>
        </div>
      </div>

      {/* Profile merged into My dashboard — decided 2026-10-26. The cards
          there hold the rest; email and phone sit here, under your name. */}
      <div className="flex flex-col gap-1.5">
        <Fact icon={Mail} label="Email">
          <TruncatedText>{user.email}</TruncatedText>
        </Fact>
        <Fact icon={Phone} label="Phone">
          {user.phone ?? <Unknown>Not given</Unknown>}
        </Fact>
      </div>

      {/* One group, General, that opens and closes — open by default. Its
          pages hang off a grey line on the left. */}
      <Collapsible defaultOpen className="border-t pt-3">
        <CollapsibleTrigger className="group flex h-8 w-full items-center gap-2.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <LayoutGrid className="size-4 shrink-0" aria-hidden />
          General
          {/* aria-expanded, not data-open: see the main sidebar. */}
          <ChevronDown className="ml-auto size-3.5 shrink-0 transition-transform group-aria-expanded:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="h-[var(--collapsible-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0 motion-reduce:transition-none">
          <nav aria-label="Settings" className="mt-1 ml-2 flex flex-col border-l">
            {PAGES.map((page) => (
              <PageLink
                key={page.href}
                href={page.href}
                icon={page.icon}
                active={pathname.startsWith(page.href)}
                soon={page.soon}
              >
                {page.title}
              </PageLink>
            ))}
          </nav>
        </CollapsibleContent>
      </Collapsible>
    </aside>
  )
}

export { SettingsAside }

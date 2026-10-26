import type { Metadata } from "next"
import {
  Archive,
  BarChart3,
  CloudAlert,
  DatabaseBackup,
  HardDrive,
  Inbox,
  KeyRound,
  LifeBuoy,
  LogIn,
  MailWarning,
  ServerCrash,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  UserCheck,
  UserX,
} from "lucide-react"

import { FaqGroup, FaqItem } from "@/components/settings/faqItem"
import { Switch } from "@/components/ui/switch"
import { requireUser } from "@/lib/auth"
import { isPrivileged, OWNER } from "@/lib/roles"

export const metadata: Metadata = {
  title: "Notifications",
}

/**
 * Notifications — decided 2026-10-26: emails this system can really send,
 * each built on something it already records (sign-ins, backups, the inbox,
 * the server's health, Google Analytics, invitations). None is built yet, so
 * every switch is off and locked, with a Coming soon tag.
 *
 * <p>Each person sees only what concerns them: backups and the server are the
 * Owner's, people are for administrators, the inbox and SEO for whoever can
 * open those pages.
 */

type Alert = {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

type Group = { title: string; alerts: Alert[]; show: boolean }

/** Off, locked, and labelled — on every line until these are built. */
function ComingSoonSwitch() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex items-center gap-1 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[0.6rem] tracking-wider text-muted-foreground uppercase">
        <Sparkles className="size-3 shrink-0" aria-hidden />
        Coming soon
      </span>
      <Switch checked={false} disabled aria-label="Not available yet" />
    </span>
  )
}

export default async function NotificationsPage() {
  const user = await requireUser()
  const can = (permission: string) => user.permissions.includes(permission)
  const owner = user.role === OWNER

  const groups: Group[] = [
    {
      title: "Your account",
      show: true,
      alerts: [
        { title: "New sign-in", description: "An email when your account is signed in on a new device.", icon: LogIn },
        { title: "Failed sign-in tries", description: "An email when someone keeps typing a wrong password for you.", icon: ShieldAlert },
        { title: "Password changed", description: "An email each time your password is changed.", icon: KeyRound },
        { title: "Few recovery codes left", description: "A reminder when you have 3 recovery codes or fewer.", icon: LifeBuoy },
      ],
    },
    {
      title: "Inbox",
      show: can("INBOX:READ"),
      alerts: [
        { title: "New email", description: "An email when a new message reaches the shared inbox.", icon: Inbox },
        { title: "Waiting for a reply", description: "A reminder when an email has had no reply for 24 hours.", icon: MailWarning },
      ],
    },
    {
      title: "People",
      show: isPrivileged(user.role),
      alerts: [
        { title: "Invitation accepted", description: "An email when someone you invited joins.", icon: UserCheck },
        { title: "Account locked", description: "An email when an account locks after too many wrong tries.", icon: UserX },
      ],
    },
    {
      title: "SEO",
      show: can("SEO_OVERVIEW:READ"),
      alerts: [
        { title: "Weekly summary", description: "Each Monday, last week's visits for every brand.", icon: BarChart3 },
        { title: "Traffic drop", description: "An email when a brand's visits fall by half in a day.", icon: TrendingDown },
      ],
    },
    {
      title: "Backups",
      show: owner,
      alerts: [
        { title: "Backup failed", description: "An email when the 03:00 backup fails or does not run.", icon: DatabaseBackup },
        { title: "Cloud almost full", description: "An email when backups pass 8 GB of the 10 GB free space.", icon: CloudAlert },
        { title: "Monthly backup report", description: "On the 1st, how many backups ran and how big they are.", icon: Archive },
      ],
    },
    {
      title: "Server",
      show: owner,
      alerts: [
        { title: "Disk almost full", description: "An email when the server's disk is more than 85% full.", icon: HardDrive },
        { title: "Server errors", description: "An email when the server starts failing requests.", icon: ServerCrash },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="font-heading text-base font-semibold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground">Choose what we email you about. All coming soon.</p>
      </div>

      <div className="flex w-full flex-col gap-8">
        {groups
          .filter((group) => group.show)
          .map((group) => (
            <FaqGroup key={group.title} title={group.title}>
              {group.alerts.map((alert) => (
                <FaqItem
                  key={alert.title}
                  question={alert.title}
                  icon={alert.icon}
                  action={<ComingSoonSwitch />}
                >
                  <p>{alert.description}</p>
                </FaqItem>
              ))}
            </FaqGroup>
          ))}
      </div>
    </div>
  )
}

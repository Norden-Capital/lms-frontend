import { PermissionRefused } from "@/components/access/permissionRefused"
import { PageHeader } from "@/components/layout/pageHeader"
import { SeoTabs } from "@/components/seo/seoTabs"
import { requireUser } from "@/lib/auth"

/** What it takes to open any of these four screens. */
const READ = "SEO_OVERVIEW:READ"

/**
 * Everything the four SEO screens share: the title, the tabs, and the gate.
 *
 * <p><b>Guarded here rather than in each page</b>, which is a deliberate
 * exception to the note in `app/(app)/layout.tsx` saying layouts do not guard
 * routes. That note is about the application shell, which wraps every screen and
 * must not have an opinion about any of them. This wraps exactly four pages that
 * share exactly one permission, and repeating the same four lines in each is how
 * the fifth one gets added without them.
 *
 * <p>⚠️ One consequence worth knowing: Next keeps a layout mounted while you
 * move between its children, so this runs when you enter the section and not on
 * every tab. That is fine while nothing is fetched — and when something is, the
 * endpoint serving it carries its own `@PreAuthorize`, which is the check that
 * actually matters.
 */
export default async function SeoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()

  if (!user.permissions.includes(READ)) {
    return <PermissionRefused module="search performance" permission={READ} />
  }

  return (
    // h-full + overflow-hidden so the header and tabs stay put and each screen
    // scrolls its own content — the same chain the users and backups pages use.
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4 sm:p-6">
      <PageHeader
        title="Search performance"
        description="How the site is doing in Google Search."
      />

      <SeoTabs />

      {children}
    </div>
  )
}

import { PermissionRefused } from "@/components/access/permissionRefused"
import { requireUser } from "@/lib/auth"

const READ = "SEO_OVERVIEW:READ"

/**
 * The SEO Overview's frame — only for accounts with SEO_OVERVIEW:READ. The
 * backend checks the same permission on every call.
 */
export default async function SeoLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()

  if (!user.permissions.includes(READ)) {
    return <PermissionRefused module="the SEO overview" permission={READ} />
  }

  return (
    // The page scrolls as a whole: cards, chart, lists and the table.
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto p-4 sm:p-6">{children}</div>
  )
}

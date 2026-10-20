import { PageHeader } from "@/components/layout/pageHeader"
import { Section } from "@/components/users/formSection"
import { PermissionPickerSkeleton } from "@/components/users/usersLoading"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The invite form while it loads — decided 2026-10-20. The same header and the
 * same three sections, with the real labels and grey boxes for the fields, so
 * nothing moves when the form arrives.
 */

/** A label over a field, as the form draws them. */
function FieldSkeleton({ label, note = false }: { label: string; note?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm leading-none font-medium">{label}</span>
      <Skeleton className="h-8" />
      {note && <Skeleton className="my-0.5 h-3 w-48" />}
    </div>
  )
}

export default function AddUserLoading() {
  return (
    <div
      className="flex h-full flex-col gap-6 overflow-y-auto p-6 pb-3"
      role="status"
      aria-label="Loading"
    >
      <PageHeader
        title="Invite user"
        description="Send an invitation and choose what they can do."
        backHref="/users"
        backLabel="Back to users"
        actions={<Skeleton className="h-8 w-32" aria-hidden />}
      />

      <div className="flex w-full flex-col gap-4" aria-hidden>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Section title="Details" description="We send the invitation to their email.">
            <div className="grid gap-3 sm:grid-cols-2">
              <FieldSkeleton label="First name" />
              <FieldSkeleton label="Last name" />
            </div>
            <div className="grid items-start gap-3 sm:grid-cols-2">
              <FieldSkeleton label="Email" note />
              <FieldSkeleton label="Phone" />
            </div>
            <Skeleton className="h-[3.125rem]" />
          </Section>

          <Section title="Role" description="Their basic access level.">
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="min-h-[5.5rem] flex-1" />
              <Skeleton className="min-h-[5.5rem] flex-1" />
            </div>
          </Section>
        </div>

        <Section
          title="Permissions"
          description="What the role gives. You can change it for this person."
        >
          <PermissionPickerSkeleton />
        </Section>
      </div>
    </div>
  )
}

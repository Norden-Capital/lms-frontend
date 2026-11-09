import { ApplicationsSkeleton } from "@/components/customers/customersLoading"

/** Failed while it loads — the same screen, in grey. */
export default function FailedLoading() {
  return (
    <ApplicationsSkeleton
      title="Failed"
      description="People who finished the form, but LeadScout did not take them."
      heading="All failed"
    />
  )
}

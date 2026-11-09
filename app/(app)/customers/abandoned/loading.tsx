import { ApplicationsSkeleton } from "@/components/customers/customersLoading"

/** Abandoned while it loads — the same screen, in grey. */
export default function AbandonedLoading() {
  return (
    <ApplicationsSkeleton
      title="Abandoned"
      description="People who finished step 1 but not step 2."
      heading="All abandoned"
      showResult={false}
    />
  )
}

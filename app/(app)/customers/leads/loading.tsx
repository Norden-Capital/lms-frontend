import { ApplicationsSkeleton } from "@/components/customers/customersLoading"

/** Leads while it loads — the same screen, in grey. */
export default function LeadsLoading() {
  return (
    <ApplicationsSkeleton
      title="Leads"
      description="People who finished the form and were sent to LeadScout."
      heading="All leads"
    />
  )
}

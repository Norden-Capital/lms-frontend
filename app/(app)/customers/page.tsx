import { redirect } from "next/navigation"

/**
 * Customer List has three lists of its own — decided 2026-10-26. The first
 * one is Leads. The old sample table (invented rows) is gone with this.
 */
export default function CustomersPage() {
  redirect("/customers/leads")
}

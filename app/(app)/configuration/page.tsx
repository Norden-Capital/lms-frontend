import { redirect } from "next/navigation"

/** Configuration has sections of its own; the first one is Brands. */
export default function ConfigurationPage() {
  redirect("/configuration/brands")
}

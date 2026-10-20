"use client"

import { useState } from "react"
import { Globe } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { MailSender } from "@/lib/mailTypes"
import { cn } from "@/lib/utils"

/**
 * An email's Gmail labels, which are its brands — decided 2026-10-20. A label
 * that matches a brand on Configuration → Brands carries that brand's logo; a
 * label that matches none shows a plain globe instead.
 *
 * <p>A label matches a brand by name or by domain, ignoring case, spaces and
 * dots: "Ask4Loan", "ask4loan" and "Ask4loan.ca" are all ask4loan.ca.
 */

function key(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

/** The brand a label stands for, if any. */
function brandFor(label: string, brands: MailSender[]) {
  const wanted = key(label)
  return brands.find((brand) => {
    const domain = brand.email.split("@")[1] ?? ""
    return (
      key(brand.name) === wanted ||
      key(domain) === wanted ||
      key(domain.split(".")[0] ?? "") === wanted
    )
  })
}

/** A brand's logo, small; the globe when it has none or it fails to load. */
function LabelLogo({ src }: { src: string | null | undefined }) {
  const [broken, setBroken] = useState(false)

  if (!src || broken) {
    return <Globe className="size-3 shrink-0 text-muted-foreground" aria-hidden />
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className="size-3.5 shrink-0 rounded-sm object-contain"
    />
  )
}

function BrandLabels({
  labels,
  brand,
  brands,
  className,
}: {
  labels: string[]
  /** The brand address it was sent to — shown too when no label already names it. */
  brand: string | null
  brands: MailSender[]
  className?: string
}) {
  const matched = labels.map((label) => ({ label, brand: brandFor(label, brands) }))
  const addressBrand = brand ? brands.find((entry) => entry.email === brand) : undefined
  const showAddress = addressBrand && !matched.some((entry) => entry.brand?.email === addressBrand.email)

  if (matched.length === 0 && !showAddress) return null

  return (
    <span className={cn("flex flex-wrap gap-1.5", className)}>
      {showAddress && (
        <Badge variant="outline" className="gap-1">
          <LabelLogo src={addressBrand.logoUrl} />
          {addressBrand.name}
        </Badge>
      )}
      {matched.map(({ label, brand: match }) => (
        <Badge key={label} variant="outline" className="gap-1">
          <LabelLogo src={match?.logoUrl} />
          {label}
        </Badge>
      ))}
    </span>
  )
}

export { BrandLabels, LabelLogo }

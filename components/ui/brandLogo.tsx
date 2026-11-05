"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"

/** The logo the site declared, or its initial when there is none or it fails to load. */
function BrandLogo({
  name,
  logoUrl,
  className,
}: {
  name: string
  logoUrl: string | null
  /** The size, `size-7` by default. */
  className?: string
}) {
  const [broken, setBroken] = useState(false)

  if (!logoUrl || broken) {
    return (
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium",
          className
        )}
      >
        {name.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    // A plain img: the logo lives on the brand's own site.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className={cn("size-7 shrink-0 rounded-md border bg-white object-contain p-0.5", className)}
    />
  )
}

/** The logo on its own, text-sized: no border, fill or padding. For tables and menus. */
const SMALL_LOGO = "size-4 rounded-none border-0 bg-transparent p-0 text-[0.55rem]"

export { BrandLogo, SMALL_LOGO }

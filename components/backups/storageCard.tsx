"use client"

import { useState } from "react"
import { Cloud, HardDrive, Server } from "lucide-react"

import { StatCard } from "@/components/stats/statCard"
import type { BackupStatus } from "@/lib/backupTypes"
import { bytes, percent } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Where the backups are kept, one place at a time — decided 2026-10-20: a
 * switch between Cloudflare R2 and the server, rather than both stacked in one
 * card, so the card stays the size of the others.
 */

/**
 * Where the bar changes colour.
 *
 * <p>Amber well before full, because the useful warning is the one that arrives
 * while there is still time to do something. A bar that only turns red at 100%
 * is a bar that tells you after the backup has already failed.
 */
const WARN = 60
const FULL = 80

/** Green, then amber, then red as a store fills. Whole class names, so Tailwind finds them. */
function fillTone(used: number, kind: "text" | "bg") {
  if (used >= FULL) return kind === "text" ? "text-destructive" : "bg-destructive"
  if (used >= WARN) return kind === "text" ? "text-warning" : "bg-warning"
  return kind === "text" ? "text-success" : "bg-success"
}

type Place = "cloud" | "server"

const PLACES: { key: Place; label: string; icon: typeof Cloud }[] = [
  { key: "cloud", label: "Cloud", icon: Cloud },
  { key: "server", label: "Server", icon: Server },
]

/** The two-way switch in the card's label row. */
function PlaceSwitch({ value, onChange }: { value: Place; onChange: (place: Place) => void }) {
  return (
    <div role="radiogroup" aria-label="Show storage for" className="flex rounded-md border bg-muted/40 p-0.5">
      {PLACES.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          type="button"
          role="radio"
          aria-checked={value === key}
          title={label}
          onClick={() => onChange(key)}
          className={cn(
            "flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[0.7rem] text-muted-foreground transition-colors hover:text-foreground",
            value === key && "bg-card text-foreground shadow-sm"
          )}
        >
          <Icon className="size-3" aria-hidden />
          {label}
        </button>
      ))}
    </div>
  )
}

function StorageCard({ status }: { status: BackupStatus }) {
  const [place, setPlace] = useState<Place>("cloud")
  const toggle = <PlaceSwitch value={place} onChange={setPlace} />

  if (place === "cloud") {
    const used =
      status.cloudLimitBytes > 0 ? (status.cloudBackupBytes / status.cloudLimitBytes) * 100 : 0

    return (
      <StatCard
        icon={Cloud}
        label="Storage"
        action={toggle}
        hint={
          <>
            Backups in the cloud. The first 10 GB are free.
          </>
        }
        value={status.cloudConfigured ? percent(used, 1) : "Off"}
        tone={status.cloudConfigured ? fillTone(used, "text") : "text-warning"}
        bar={status.cloudConfigured ? { percent: used, tone: fillTone(used, "bg") } : undefined}
        detail={
          status.cloudConfigured
            ? `Cloudflare R2 — ${bytes(status.cloudBackupBytes)} of ${bytes(status.cloudLimitBytes)}`
            : "Cloud is off. Backups are on the server only."
        }
        footerIcon={HardDrive}
        footer="Free up to 10 GB"
      />
    )
  }

  const total = status.destinationTotalBytes
  const used = total > 0 ? (status.destinationUsedBytes / total) * 100 : 0
  const backups = total > 0 ? (status.serverBackupBytes / total) * 100 : 0
  const barTone = fillTone(used, "bg")

  return (
    <StatCard
      icon={Server}
      label="Storage"
      action={toggle}
      hint={
        <>
          The server&apos;s disk. Dark part is backups. If it gets full, the app
          stops.
        </>
      }
      value={percent(used, 1)}
      tone={fillTone(used, "text")}
      bar={{
        percent: used,
        tone: barTone,
        segments: [
          { percent: backups, tone: barTone },
          { percent: used - backups, tone: cn(barTone, "opacity-40") },
        ],
      }}
      detail={
        <>
          Backups {bytes(status.serverBackupBytes)} · other{" "}
          {bytes(Math.max(0, status.destinationUsedBytes - status.serverBackupBytes))} · free{" "}
          {bytes(Math.max(0, total - status.destinationUsedBytes))}
        </>
      }
      footerIcon={HardDrive}
      footer={`${bytes(status.destinationUsedBytes)} of ${bytes(total)} used`}
    />
  )
}

export { StorageCard }

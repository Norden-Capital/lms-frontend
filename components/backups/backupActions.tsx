"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DatabaseBackup, Download, LoaderCircle, RotateCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { backupDownloadLink, deleteBackup, startBackup } from "@/app/(app)/backups/actions"
import { DialogHead, Refusal } from "@/components/users/userActionDialogs"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import type { BackupRun } from "@/lib/backupTypes"
import { bytes, utcStamp } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * The three things the Owner can do on the Backups page — decided 2026-10-20:
 * back up now, download a backup, delete a backup.
 */

/** "Back up now", in the page header. Disabled while one is already running. */
function BackUpNowButton({ running }: { running: boolean }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const busy = pending || running

  return (
    <Button
      size="sm"
      disabled={busy}
      onClick={() =>
        start(async () => {
          const result = await startBackup()
          if (result.ok) {
            toast.success("Backup started.")
            router.refresh()
          } else {
            toast.error(result.message ?? "Could not start the backup.")
          }
        })
      }
    >
      {busy ? (
        <LoaderCircle data-icon="inline-start" className="animate-spin" />
      ) : (
        <DatabaseBackup data-icon="inline-start" />
      )}
      {running ? "Backing up…" : "Back up now"}
    </Button>
  )
}

/** Reads the page again from the server, without reloading the browser tab. */
function ReloadButton() {
  const router = useRouter()
  const [pending, start] = useTransition()

  return (
    <Button
      size="icon-sm"
      variant="outline"
      disabled={pending}
      onClick={() => start(() => router.refresh())}
      title="Reload"
      aria-label="Reload"
    >
      <RotateCw className={cn(pending && "animate-spin")} />
    </Button>
  )
}

/**
 * Keeps the page up to date while a backup runs, so "In progress" turns into
 * the result without anybody reloading. Stops as soon as nothing is running.
 */
function RefreshWhileRunning({ running }: { running: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => router.refresh(), 3000)
    return () => window.clearInterval(timer)
  }, [running, router])

  return null
}

const ACTION_BUTTON =
  "rounded-sm p-1 text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40"

/**
 * Download, then delete — least to most destructive, left to right, so a
 * misplaced click lands on the harmless one.
 */
function RowActions({ run }: { run: BackupRun }) {
  const [downloading, startDownload] = useTransition()
  const [confirming, setConfirming] = useState(false)

  const why =
    run.outcome === "running"
      ? "Still running"
      : run.deletedAt
        ? "This backup was deleted"
        : "This run left no file"

  function download() {
    startDownload(async () => {
      const result = await backupDownloadLink(run.id)
      if (result.ok && result.url) window.location.assign(result.url)
      else toast.error(result.message ?? "Could not start the download.")
    })
  }

  return (
    <span className="flex items-center justify-end gap-1">
      <button
        type="button"
        disabled={!run.downloadable || downloading}
        onClick={download}
        title={run.downloadable ? "Download this backup" : why}
        aria-label="Download this backup"
        className={ACTION_BUTTON}
      >
        {downloading ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
      </button>
      <button
        type="button"
        disabled={!run.downloadable}
        onClick={() => setConfirming(true)}
        title={run.downloadable ? "Delete this backup" : why}
        aria-label="Delete this backup"
        className={ACTION_BUTTON}
      >
        <Trash2 className="size-3.5" />
      </button>

      <DeleteBackupDialog run={run} open={confirming} onOpenChange={setConfirming} />
    </span>
  )
}

/** Where a delete removes the file from, in the sentence that asks. */
const PLACES: Record<string, string> = {
  "Server + Cloudflare R2": "the server and from Cloudflare R2",
  Server: "the server",
  "Cloudflare R2": "Cloudflare R2",
}

/**
 * The one control on this screen that destroys a backup, which is the thing
 * the screen exists to protect — so it asks first. Closes only on success, so a
 * refusal has somewhere to appear.
 */
function DeleteBackupDialog({
  run,
  open,
  onOpenChange,
}: {
  run: BackupRun
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | undefined>()

  function confirm() {
    setError(undefined)
    start(async () => {
      const result = await deleteBackup(run.id)
      if (result.ok) {
        onOpenChange(false)
        toast.success("Backup deleted.")
        router.refresh()
      } else {
        setError(result.message ?? "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={pending ? undefined : onOpenChange}>
      <AlertDialogContent size="sm">
        <DialogHead icon={Trash2} tone="bg-destructive/10 text-destructive" title="Delete backup?">
          The backup from {utcStamp(run.startedAt)} UTC ({bytes(run.sizeBytes)}) is removed from{" "}
          {PLACES[run.destination ?? ""] ?? "the server"}. You can&apos;t undo this.
        </DialogHead>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={pending} onClick={confirm}>
            {pending ? "Deleting…" : "Delete backup"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { BackUpNowButton, ReloadButton, RefreshWhileRunning, RowActions }

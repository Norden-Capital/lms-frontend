"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Copy, LoaderCircle, Megaphone, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { addChannel, removeChannel } from "@/app/(app)/configuration/channels/actions"
import { Panel } from "@/components/system/panel"
import { DialogHead, Refusal } from "@/components/users/userActionDialogs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { channelLabel } from "@/lib/applicationTypes"
import type { Brand } from "@/lib/brands"

/**
 * Channels — decided 2026-11-02. A channel is the word after utm_source=, and
 * its link goes straight to the brand's apply form. Built here, so every link
 * is written the same way. SEO has no link: no tag already means SEO.
 */

const HEAD =
  "py-2 text-left font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

const ROW_BUTTON =
  "rounded-sm p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"

/** https://apply.365loan.ca/?utm_source=email */
function linkFor(brand: Brand, channel: string) {
  return `https://apply.${brand.domain}/?utm_source=${channel}`
}

function ChannelsPanel({ channels, brands }: { channels: string[]; brands: Brand[] }) {
  const [removing, setRemoving] = useState<string | null>(null)

  return (
    <Panel
      title="Channels"
      hint={<>Add a channel, then use its link. Leads from that link get the channel. No tag means SEO.</>}
      action={<AddChannel />}
      bodyClassName="p-0"
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className={`${HEAD} w-40 pl-4`}>Channel</th>
            <th className={HEAD}>Links</th>
            <th className={`${HEAD} pr-4 text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2.5 pl-4 align-top font-medium">SEO</td>
            <td className="py-2.5 text-xs text-muted-foreground">
              No link needed. People who come from your brand sites, with no tag, count as SEO.
            </td>
            <td className="py-2.5 pr-4" />
          </tr>
          {channels.map((channel) => (
            <tr key={channel} className="border-b last:border-b-0">
              <td className="py-2.5 pl-4 align-top font-medium">{channelLabel(channel)}</td>
              <td className="py-2 pr-3">
                {brands.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Add a brand first.</span>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {brands.map((brand) => (
                      <LinkLine key={brand.id} name={brand.name} link={linkFor(brand, channel)} />
                    ))}
                  </ul>
                )}
              </td>
              <td className="py-2.5 pr-4 text-right align-top">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className={ROW_BUTTON}
                        onClick={() => setRemoving(channel)}
                        aria-label={`Remove ${channel}`}
                      />
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Remove this channel</TooltipContent>
                </Tooltip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {removing && <RemoveDialog channel={removing} onClose={() => setRemoving(null)} />}
    </Panel>
  )
}

/** One brand's link, with a copy button. */
function LinkLine({ name, link }: { name: string; link: string }) {
  function copy() {
    navigator.clipboard
      .writeText(link)
      .then(() => toast.success("Link copied."))
      .catch(() => toast.error("Could not copy. Select it instead."))
  }

  return (
    <li className="flex items-center gap-2">
      <span className="w-32 shrink-0 truncate text-xs text-muted-foreground">{name}</span>
      <code className="min-w-0 truncate font-mono text-xs select-all">{link}</code>
      <Tooltip>
        <TooltipTrigger
          render={<button type="button" className={ROW_BUTTON} onClick={copy} aria-label={`Copy the ${name} link`} />}
        >
          <Copy className="size-3.5" />
        </TooltipTrigger>
        <TooltipContent>Copy link</TooltipContent>
      </Tooltip>
    </li>
  )
}

/** One input and a button — the channel's name is all there is to type. */
function AddChannel() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [pending, start] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!name.trim() || pending) return
    start(async () => {
      const result = await addChannel(name.trim().toLowerCase())
      if (!result.ok) {
        toast.error(result.message ?? "The channel could not be added.")
        return
      }
      toast.success("Channel added.")
      setName("")
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative">
        <Megaphone
          className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Channel, e.g. facebook"
          aria-label="Channel name"
          className="h-8 w-56 bg-card pl-8"
          disabled={pending}
        />
      </div>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              type="submit"
              size="icon-sm"
              className="hover:bg-primary/80"
              aria-label="Add channel"
              aria-disabled={pending || !name.trim()}
            />
          }
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
        </TooltipTrigger>
        <TooltipContent>{pending ? "Adding…" : "Add channel"}</TooltipContent>
      </Tooltip>
    </form>
  )
}

function RemoveDialog({ channel, onClose }: { channel: string; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | undefined>()

  return (
    <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent size="sm">
        <DialogHead icon={Trash2} tone="bg-destructive/10 text-destructive" title="Remove channel?">
          {channelLabel(channel)} leaves this list. Its leads keep their channel, and its links still work.
        </DialogHead>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await removeChannel(channel)
                if (!result.ok) {
                  setError(result.message ?? "Something went wrong. Please try again.")
                  return
                }
                toast.success("Channel removed.")
                onClose()
                router.refresh()
              })
            }
          >
            {pending ? "Removing…" : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export { ChannelsPanel }

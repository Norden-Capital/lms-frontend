"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ExternalLink, Globe, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  addBrand,
  deleteBrand,
  refreshBrand,
  setBrandActive,
  setBrandGa4,
  updateBrand,
} from "@/app/(app)/configuration/brands/actions"
import { QuarterSparkline } from "@/components/charts/quarterSparkline"
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
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Brand } from "@/lib/brands"
import { utcStamp } from "@/lib/format"
import { cn } from "@/lib/utils"

/**
 * Brands — decided 2026-10-20. Added by typing the website alone: the name and
 * logo are read from the site, and the address is support@{domain}. Every brand
 * address forwards into the inbox mailbox; the inbox tags mail by it and
 * answers from it. Switched off, a brand leaves the inbox but is kept.
 */

const HEAD =
  "py-2 text-left font-mono text-[0.65rem] font-medium tracking-wider text-muted-foreground uppercase"

const ROW_BUTTON =
  "rounded-sm p-1 text-muted-foreground transition-colors hover:bg-foreground/10 hover:text-foreground"

function BrandsPanel({ brands }: { brands: Brand[] }) {
  const [removing, setRemoving] = useState<Brand | null>(null)

  return (
    <Panel
      title="Brands"
      hint={
        <>
          Add a brand by its website. We get its name and logo. Its email is
          support@ plus the domain. Set up this email in Gmail to send replies.
        </>
      }
      action={<AddBrand />}
      bodyClassName="p-0"
    >
      {brands.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No brands yet. Add one by its website above.
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className={`${HEAD} pl-4`}>Brand</th>
              <th className={HEAD}>Email address</th>
              <th className={HEAD}>Website</th>
              <th className={HEAD}>Replies</th>
              <th className={HEAD}>Google Analytics</th>
              <th className={HEAD}>Added</th>
              <th className={HEAD}>Active</th>
              <th className={`${HEAD} pr-4 text-right`}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.map((brand) => (
              <BrandRow key={brand.id} brand={brand} onRemove={() => setRemoving(brand)} />
            ))}
          </tbody>
        </table>
      )}

      {removing && <RemoveDialog brand={removing} onClose={() => setRemoving(null)} />}
    </Panel>
  )
}

/** One input and a button — the website is all there is to type. */
function AddBrand() {
  const router = useRouter()
  const [website, setWebsite] = useState("")
  const [pending, start] = useTransition()

  function submit(event: React.FormEvent) {
    event.preventDefault()
    if (!website.trim() || pending) return
    start(async () => {
      const result = await addBrand(website.trim())
      if (!result.ok) {
        toast.error(result.message ?? "The brand could not be added.")
        return
      }
      toast.success("Brand added.")
      setWebsite("")
      router.refresh()
    })
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative">
        <Globe
          className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          placeholder="Brand website, e.g. ask4loan.ca"
          aria-label="Brand website"
          className="h-8 w-64 bg-card pl-8"
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
              aria-label="Add brand"
              aria-disabled={pending || !website.trim()}
            />
          }
        >
          {pending ? <LoaderCircle className="animate-spin" /> : <Plus />}
        </TooltipTrigger>
        <TooltipContent>{pending ? "Adding…" : "Add brand"}</TooltipContent>
      </Tooltip>
    </form>
  )
}

/** The logo the site declared, or its initial when there is none or it fails to load. */
function BrandLogo({ brand }: { brand: Brand }) {
  const [broken, setBroken] = useState(false)

  if (!brand.logoUrl || broken) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-medium">
        {brand.name.charAt(0).toUpperCase()}
      </span>
    )
  }

  return (
    // A plain img: the logo lives on the brand's own site.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={brand.logoUrl}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
      className="size-7 shrink-0 rounded-md border bg-white object-contain p-0.5"
    />
  )
}

/**
 * A cell that turns into an input when clicked — decided 2026-10-20, so a
 * name read wrong from a website, or a brand that is not support@, can be put
 * right without a dialog. Enter or clicking away saves; Escape cancels.
 */
function EditableText({
  value,
  label,
  type = "text",
  placeholder,
  allowEmpty = false,
  onSave,
}: {
  value: string
  /** Shown, faint, while there is no value. */
  placeholder?: string
  /** Saving an empty box clears the value, instead of being ignored. */
  allowEmpty?: boolean
  /** What it is, for the tooltip and the screen reader — "name". */
  label: string
  type?: "text" | "email"
  onSave: (next: string) => Promise<{ ok?: boolean; message?: string }>
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [pending, start] = useTransition()
  // Escape closes the input, and closing it fires blur — which would save.
  const cancelled = useRef(false)

  function open() {
    setDraft(value)
    cancelled.current = false
    setEditing(true)
  }

  function save() {
    if (cancelled.current) return
    const next = draft.trim()
    setEditing(false)
    if ((!next && !allowEmpty) || next === value) return
    start(async () => {
      const result = await onSave(next)
      if (!result.ok) {
        toast.error(result.message ?? `The ${label} could not be saved.`)
        return
      }
      toast.success(`Brand ${label} saved.`)
      router.refresh()
    })
  }

  // The text always keeps its place; while editing it is only hidden, and the
  // input is laid over it. The cell keeps the text's size, so nothing in the
  // table moves — decided 2026-10-20.
  return (
    <span className="relative inline-flex max-w-full">
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={open}
              disabled={pending}
              tabIndex={editing ? -1 : undefined}
              aria-hidden={editing || undefined}
              aria-label={`Change the ${label}`}
              className={cn(
                "-mx-1.5 truncate rounded-sm px-1.5 py-0.5 text-left transition-colors hover:bg-foreground/10",
                editing && "invisible"
              )}
            />
          }
        >
          {pending ? draft : value || <span className="text-muted-foreground/70">{placeholder}</span>}
        </TooltipTrigger>
        <TooltipContent>Click to change the {label}</TooltipContent>
      </Tooltip>

      {editing && (
        <input
          autoFocus
          type={type}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              cancelled.current = true
              setEditing(false)
            }
          }}
          aria-label={`Brand ${label}`}
          // Exactly over the text: same box, same padding, same type. A ring
          // rather than a border, because a border would add to the size.
          className="absolute inset-y-0 -left-1.5 w-[calc(100%+0.75rem)] min-w-24 rounded-sm bg-card px-1.5 py-0.5 text-sm text-foreground ring-1 ring-ring outline-none"
        />
      )}
    </span>
  )
}

function BrandRow({ brand, onRemove }: { brand: Brand; onRemove: () => void }) {
  const router = useRouter()
  const [active, setActive] = useState(brand.active)
  const [busy, setBusy] = useState<"refresh" | "active" | null>(null)
  const [, start] = useTransition()

  function toggle(next: boolean) {
    setActive(next)
    setBusy("active")
    start(async () => {
      const result = await setBrandActive(brand.id, next)
      setBusy(null)
      if (!result.ok) {
        setActive(!next)
        toast.error(result.message ?? "The brand could not be changed.")
        return
      }
      toast.success(next ? `${brand.name} switched on.` : `${brand.name} switched off.`)
      router.refresh()
    })
  }

  function refresh() {
    setBusy("refresh")
    start(async () => {
      const result = await refreshBrand(brand.id)
      setBusy(null)
      if (!result.ok) {
        toast.error(result.message ?? "The website could not be read.")
        return
      }
      toast.success("Name and logo updated.")
      router.refresh()
    })
  }

  return (
    <tr className={cn("border-b last:border-b-0", !active && "text-muted-foreground")}>
      <td className="py-2.5 pl-4">
        <span className={cn("flex items-center gap-2.5 font-medium", !active && "opacity-60")}>
          <BrandLogo brand={brand} />
          <EditableText
            value={brand.name}
            label="name"
            onSave={(name) => updateBrand(brand.id, name, brand.email)}
          />
        </span>
      </td>
      <td className="py-2.5 text-muted-foreground">
        <EditableText
          value={brand.email}
          label="email address"
          type="email"
          onSave={(email) => updateBrand(brand.id, brand.name, email)}
        />
      </td>
      <td className="py-2.5">
        <a
          href={`https://${brand.domain}`}
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1 text-info underline-offset-4 hover:underline"
        >
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
          {brand.domain}
        </a>
      </td>
      <td className="py-2.5">
        {/* This year by quarter, and the total: one more each time an email is
            answered from this brand's address. */}
        <QuarterSparkline values={brand.replies} unit={{ one: "reply", many: "replies" }} />
      </td>
      <td className="py-2.5 font-mono text-xs text-muted-foreground">
        {/* Its GA4 property number, for the SEO Overview. Empty clears it. */}
        <EditableText
          value={brand.ga4PropertyId ?? ""}
          label="Google Analytics ID"
          placeholder="Add ID"
          allowEmpty
          onSave={(id) => setBrandGa4(brand.id, id)}
        />
      </td>
      <td className="py-2.5 font-mono text-xs text-muted-foreground">{utcStamp(brand.createdAt)}</td>
      <td className="py-2.5">
        <Tooltip>
          <TooltipTrigger render={<span className="inline-flex" />}>
            <Switch
              size="sm"
              checked={active}
              disabled={busy === "active"}
              onCheckedChange={toggle}
              aria-label={active ? `Switch ${brand.name} off` : `Switch ${brand.name} on`}
            />
          </TooltipTrigger>
          <TooltipContent>
            {active ? "On: shown in the inbox" : "Off: hidden from the inbox"}
          </TooltipContent>
        </Tooltip>
      </td>
      <td className="py-2.5 pr-4">
        <span className="flex items-center justify-end gap-1">
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className={ROW_BUTTON}
                  onClick={refresh}
                  disabled={busy === "refresh"}
                  aria-label={`Read ${brand.name}'s name and logo again`}
                />
              }
            >
              <RefreshCw className={cn("size-3.5", busy === "refresh" && "animate-spin")} />
            </TooltipTrigger>
            <TooltipContent>Get the name and logo again</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  className={ROW_BUTTON}
                  onClick={onRemove}
                  aria-label={`Remove ${brand.name}`}
                />
              }
            >
              <Trash2 className="size-3.5" />
            </TooltipTrigger>
            <TooltipContent>Remove this brand</TooltipContent>
          </Tooltip>
        </span>
      </td>
    </tr>
  )
}

function RemoveDialog({ brand, onClose }: { brand: Brand; onClose: () => void }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | undefined>()

  return (
    <AlertDialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <AlertDialogContent size="sm">
        <DialogHead icon={Trash2} tone="bg-destructive/10 text-destructive" title="Remove brand?">
          {brand.name} ({brand.email}) will be removed. Its emails stay in Gmail.
          To just hide it, switch it off.
        </DialogHead>

        <Refusal message={error} />

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const result = await deleteBrand(brand.id)
                if (!result.ok) {
                  setError(result.message ?? "Something went wrong. Please try again.")
                  return
                }
                toast.success("Brand removed.")
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

export { BrandsPanel }

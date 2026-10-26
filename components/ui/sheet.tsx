"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * shadcn's Sheet, on Base UI's Dialog like the rest of components/ui — added
 * 2026-10-26. A panel that slides in from one edge of the screen.
 */

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 duration-150 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 data-closed:fill-mode-forwards",
        className
      )}
      {...props}
    />
  )
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          // Floating, not glued to the window — decided 2026-10-26: 12px from
          // every edge, a full border, and the same rounded-lg as the buttons.
          // bg-sidebar on every sheet — decided 2026-10-26: the sunken grey
          // gives the white cards and boxes inside something to sit against.
          // Closing: it fades as it leaves and stays gone at the end
          // (fill-mode-forwards). Without that it snapped back into view for a
          // frame before being removed — the flash, fixed 2026-10-26. It also
          // travels its width plus the 12px margin, so no strip is left showing.
          "fixed z-50 flex flex-col gap-4 rounded-lg border bg-sidebar text-sm shadow-lg outline-none duration-200 ease-out data-open:animate-in data-closed:animate-out data-closed:fade-out-0 data-closed:fill-mode-forwards",
          "data-[side=right]:inset-y-3 data-[side=right]:right-3 data-[side=right]:w-[calc(75%-0.75rem)] data-[side=right]:sm:max-w-sm data-[side=right]:data-open:[--tw-enter-translate-x:calc(100%+1rem)] data-[side=right]:data-closed:[--tw-exit-translate-x:calc(100%+1rem)]",
          "data-[side=left]:inset-y-3 data-[side=left]:left-3 data-[side=left]:w-[calc(75%-0.75rem)] data-[side=left]:sm:max-w-sm data-[side=left]:data-open:[--tw-enter-translate-x:calc(-100%-1rem)] data-[side=left]:data-closed:[--tw-exit-translate-x:calc(-100%-1rem)]",
          "data-[side=top]:inset-x-3 data-[side=top]:top-3 data-[side=top]:h-auto data-[side=top]:data-open:[--tw-enter-translate-y:calc(-100%-1rem)] data-[side=top]:data-closed:[--tw-exit-translate-y:calc(-100%-1rem)]",
          "data-[side=bottom]:inset-x-3 data-[side=bottom]:bottom-3 data-[side=bottom]:h-auto data-[side=bottom]:data-open:[--tw-enter-translate-y:calc(100%+1rem)] data-[side=bottom]:data-closed:[--tw-exit-translate-y:calc(100%+1rem)]",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={<Button variant="ghost" size="icon-sm" className="absolute top-3 right-3" />}
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5 p-4", className)} {...props} />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="sheet-footer" className={cn("mt-auto flex flex-col gap-2 p-4", className)} {...props} />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn("font-heading text-base font-medium text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}

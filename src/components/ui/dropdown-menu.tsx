"use client"

import * as React from "react"
import { Menu as MenuPrimitive } from "@base-ui/react/menu"

import { cn } from "@/lib/utils"

function DropdownMenu({ ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />
}

// Combines Portal + Positioner + Popup into one part, same as
// AlertDialogContent/DialogContent combine Portal + Overlay + Popup --
// callers just render <DropdownMenuContent> without wiring up positioning
// themselves. Positioned near its trigger (bottom-end by default) rather
// than centered on screen like a dialog.
function DropdownMenuContent({
  className,
  side = "bottom",
  align = "end",
  sideOffset = 8,
  alignOffset,
  ...props
}: MenuPrimitive.Popup.Props &
  Pick<MenuPrimitive.Positioner.Props, "side" | "align" | "sideOffset" | "alignOffset">) {
  return (
    <MenuPrimitive.Portal data-slot="dropdown-menu-portal">
      <MenuPrimitive.Positioner
        data-slot="dropdown-menu-positioner"
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "min-w-40 origin-[var(--transform-origin)] rounded-none bg-card p-1 text-sm text-foreground shadow-[-6px_10px_20px_-2px_rgba(0,0,0,0.3)] ring-1 ring-foreground/10 transition duration-150 data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
            className
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  )
}

function DropdownMenuItem({ className, ...props }: MenuPrimitive.Item.Props) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      className={cn(
        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-muted",
        className
      )}
      {...props}
    />
  )
}

// For entries that navigate via `href` (e.g. Settings, Saved Scenarios) --
// Base UI's LinkItem renders its own <a>, so these should use this instead
// of wrapping a plain DropdownMenuItem in a next/link.
function DropdownMenuLinkItem({ className, ...props }: MenuPrimitive.LinkItem.Props) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="dropdown-menu-link-item"
      className={cn(
        "flex cursor-pointer items-center gap-2 px-3 py-2 text-sm text-foreground outline-none select-none data-highlighted:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }: MenuPrimitive.Separator.Props) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-foreground/10", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
}

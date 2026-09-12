import { Combobox as ComboboxPrimitive } from "@base-ui/react"

import { cn } from "@/lib/utils"

const Combobox = ComboboxPrimitive.Root
const ComboboxValue = ComboboxPrimitive.Value
const ComboboxCollection = ComboboxPrimitive.Collection

function ComboboxTrigger({ className, ...props }: ComboboxPrimitive.Trigger.Props) {
  return <ComboboxPrimitive.Trigger className={cn("w-full", className)} {...props} />
}
function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return <ComboboxPrimitive.Input className={cn("w-full border-0 bg-transparent outline-none", className)} {...props} />
}
function ComboboxContent({ className, ...props }: ComboboxPrimitive.Popup.Props) {
  return <ComboboxPrimitive.Portal><ComboboxPrimitive.Positioner sideOffset={6} className="z-50"><ComboboxPrimitive.Popup className={cn("max-h-72 min-w-[var(--anchor-width)] overflow-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg", className)} {...props} /></ComboboxPrimitive.Positioner></ComboboxPrimitive.Portal>
}
function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) { return <ComboboxPrimitive.List className={cn("max-h-60 overflow-y-auto", className)} {...props} /> }
function ComboboxItem({ className, ...props }: ComboboxPrimitive.Item.Props) { return <ComboboxPrimitive.Item className={cn("flex w-full cursor-default items-center rounded-lg px-3 py-2 text-left text-sm outline-none data-highlighted:bg-accent", className)} {...props} /> }
function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) { return <ComboboxPrimitive.Empty className={cn("p-3 text-center text-sm text-muted-foreground", className)} {...props} /> }

export { Combobox, ComboboxCollection, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList, ComboboxTrigger, ComboboxValue }

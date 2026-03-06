import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

export function ResponsiveDialog({
  children,
  isOpen,
  setIsOpen,
  title,
  description,
  trigger,
}) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-white/10 text-slate-200">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description && (
              <DialogDescription className="text-slate-400">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="bg-slate-900 border-white/10 text-slate-200">
        <DrawerHeader className="text-left">
          <DrawerTitle>{title}</DrawerTitle>
          {description && (
            <DrawerDescription className="text-slate-400">
              {description}
            </DrawerDescription>
          )}
        </DrawerHeader>
        <div className="px-4 pb-8">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

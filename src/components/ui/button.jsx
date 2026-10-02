import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"
import { playSound } from "@/lib/game/sound"

// Chunky "3D" buttons: an inset bottom lip that compresses on press.
// The lip is a translucent dark band, so it works on any background colour.
const LIP = "shadow-[inset_0_-4px_0_rgba(0,0,0,0.22)] active:shadow-[inset_0_-1px_0_rgba(0,0,0,0.22)] active:translate-y-[3px]"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-extrabold tracking-wide transition-[transform,box-shadow,filter,background-color] duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground hover:brightness-110 ${LIP}`,
        destructive: `bg-destructive text-destructive-foreground hover:brightness-110 ${LIP}`,
        success: `bg-success text-white hover:brightness-110 ${LIP}`,
        gold: `bg-xp text-amber-950 hover:brightness-105 ${LIP}`,
        outline:
          "border-2 border-border bg-transparent text-foreground shadow-[inset_0_-3px_0_hsl(var(--border))] hover:bg-muted active:translate-y-[2px] active:shadow-none",
        secondary: `bg-muted text-foreground hover:brightness-110 ${LIP}`,
        ghost: "hover:bg-muted text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-[48px] px-5 py-2",
        sm: "min-h-[36px] rounded-xl px-3 text-xs",
        lg: "min-h-[56px] px-8 text-base uppercase tracking-wider",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, onClick, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  const handleClick = React.useCallback((e) => {
    if (variant !== 'link' && variant !== 'ghost') playSound('tap')
    onClick?.(e)
  }, [onClick, variant])
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      onClick={handleClick}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }

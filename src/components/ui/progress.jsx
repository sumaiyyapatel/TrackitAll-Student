import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// Thick rounded bar with a glossy highlight on the fill
const Progress = React.forwardRef(({ className, indicatorClassName, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-4 w-full overflow-hidden rounded-full bg-muted",
      className
    )}
    {...props}>
    <ProgressPrimitive.Indicator
      className={cn("duo-shine h-full rounded-full bg-primary transition-[width] duration-700 ease-out", indicatorClassName)}
      style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }

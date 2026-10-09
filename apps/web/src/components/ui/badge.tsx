import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-zinc-900 focus:ring-offset-1",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-900 text-white",
        secondary:
          "border-zinc-200/70 bg-zinc-100 text-zinc-700",
        destructive:
          "border-red-200/60 bg-red-50 text-red-700",
        outline: "border-zinc-200 text-zinc-700",
        success:
          "border-emerald-200/60 bg-emerald-50 text-emerald-700",
        warning:
          "border-amber-200/60 bg-amber-50 text-amber-700",
        neutral:
          "border-zinc-200/70 bg-zinc-100 text-zinc-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

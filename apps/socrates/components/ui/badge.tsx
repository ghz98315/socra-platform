import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-warm-500 text-white shadow-sm",
        secondary:
          "bg-warm-100 text-warm-700",
        destructive:
          "bg-red-100 text-red-700",
        outline: "border border-warm-200 text-warm-700 bg-white",
        success: "bg-green-100 text-green-700",
        warm: "bg-gradient-to-r from-warm-500 to-warm-600 text-white shadow-sm",
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

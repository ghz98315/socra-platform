import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warm-400 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-warm-500 text-white shadow-lg shadow-warm-500/30 hover:bg-warm-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 rounded-full",
        destructive:
          "bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 rounded-full",
        outline:
          "border-2 border-warm-200 bg-white text-warm-700 hover:bg-warm-50 hover:border-warm-300 active:scale-95 rounded-full",
        secondary:
          "bg-warm-100 text-warm-700 hover:bg-warm-200 active:scale-95 rounded-full",
        ghost: "hover:bg-warm-100 text-warm-700 hover:text-warm-900 rounded-full",
        link: "text-warm-600 underline-offset-4 hover:underline hover:text-warm-700",
        warm: "bg-gradient-to-r from-warm-500 to-warm-600 text-white shadow-lg shadow-warm-500/30 hover:from-warm-600 hover:to-warm-700 hover:shadow-xl hover:-translate-y-0.5 active:scale-95 rounded-full",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

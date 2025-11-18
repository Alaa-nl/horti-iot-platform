import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transform active:scale-[0.98] shadow-sm",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-primary/85 text-primary-foreground hover:from-primary/95 hover:to-primary/80 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5",
        destructive:
          "bg-gradient-to-r from-destructive to-destructive/85 text-destructive-foreground hover:from-destructive/95 hover:to-destructive/80 hover:shadow-lg hover:shadow-destructive/20",
        outline:
          "border-2 border-primary/30 bg-transparent text-primary hover:bg-primary/10 hover:border-primary/50 hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:shadow-md border border-border/50",
        ghost: "shadow-none hover:bg-accent/50 hover:text-accent-foreground hover:shadow-sm",
        link: "shadow-none text-primary underline-offset-4 hover:underline hover:text-primary/80",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10 p-0",
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
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

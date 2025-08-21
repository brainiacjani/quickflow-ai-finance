import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-transform transform-gpu focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[hsl(var(--primary-1))] to-[hsl(var(--primary-2))] text-white shadow-[var(--shadow-glow)] hover:brightness-105",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline: "border border-input bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] hover:shadow-sm",
        secondary: "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:brightness-95",
        ghost: "bg-transparent hover:bg-[hsl(var(--card))]",
        link: "text-[hsl(var(--primary-2))] underline-offset-4 hover:underline",
        hero: "bg-gradient-to-r from-[hsl(var(--primary-1))] to-[hsl(var(--primary-2))] text-white shadow-[var(--shadow-glow)] hover:scale-[1.02]",
        soft: "bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] border border-border/60 hover:bg-[hsl(var(--secondary))]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3 text-sm",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
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

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const shadcnInputClassName =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

const inputVariants = cva("", {
  variants: {
    variant: {
      default: shadcnInputClassName,
      admin:
        "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400",
      onboarding:
        "h-11 w-full rounded-md border border-line px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400",
      theme: "theme-field h-10 w-full px-3 text-sm font-bold outline-none",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

function Input({
  className,
  type,
  variant = "default",
  ...props
}: React.ComponentProps<"input"> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      data-variant={variant}
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  )
}

export { Input, inputVariants }

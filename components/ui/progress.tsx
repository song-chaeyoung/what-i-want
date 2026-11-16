"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Progress as ProgressPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

const progressVariants = cva("", {
  variants: {
    variant: {
      theme: "theme-progress",
      pixel: "h-3 overflow-hidden border-2 border-ink bg-track",
      admin: "h-1.5 overflow-hidden rounded-full bg-track",
    },
  },
  defaultVariants: {
    variant: "admin",
  },
})

const progressIndicatorVariants = cva("", {
  variants: {
    variant: {
      theme: "",
      pixel: "h-full",
      admin: "h-full rounded-full bg-teal",
    },
  },
  defaultVariants: {
    variant: "admin",
  },
})

function clampProgress(value: number | null | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0
  }

  return Math.min(100, Math.max(0, value))
}

function Progress({
  className,
  value,
  variant = "admin",
  indicatorClassName,
  indicatorStyle,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> & {
    indicatorClassName?: string
    indicatorStyle?: React.CSSProperties
  }) {
  const clamped = clampProgress(value)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(progressVariants({ variant }), className)}
      value={clamped}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressIndicatorVariants({ variant }), indicatorClassName)}
        style={{ width: `${clamped}%`, ...indicatorStyle }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

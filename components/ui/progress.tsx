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

function resolveMax(max: number | null | undefined) {
  if (typeof max === "number" && !Number.isNaN(max) && max > 0) {
    return max
  }

  return 100
}

function resolveValue(value: number | null | undefined, max: number) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null
  }

  return Math.min(max, Math.max(0, value))
}

function Progress({
  className,
  value,
  max,
  variant = "admin",
  indicatorClassName,
  indicatorStyle,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> &
  VariantProps<typeof progressVariants> & {
    indicatorClassName?: string
    indicatorStyle?: React.CSSProperties
  }) {
  const resolvedMax = resolveMax(max)
  const resolvedValue = resolveValue(value, resolvedMax)
  const percent =
    resolvedValue === null ? null : (resolvedValue / resolvedMax) * 100

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(progressVariants({ variant }), className)}
      value={resolvedValue}
      max={resolvedMax}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(progressIndicatorVariants({ variant }), indicatorClassName)}
        style={{
          width: percent === null ? "0%" : `${percent}%`,
          ...indicatorStyle,
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }

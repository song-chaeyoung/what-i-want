import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const shadcnCardClassName =
  "group/card flex flex-col gap-4 overflow-hidden rounded-xl bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10 has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl"

const cardVariants = cva("", {
  variants: {
    variant: {
      default: shadcnCardClassName,
      pixel: "border-2 border-ink",
      theme: "theme-card",
      admin: "rounded-md border border-line bg-white",
    },
    surface: {
      paper: "bg-paper",
      white: "bg-white",
    },
    shadow: {
      none: "",
      xs: "shadow-pixel-xs",
      md: "shadow-pixel-md",
      lg: "shadow-pixel-lg",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

const adminCardFooterClassName = "border-t border-line bg-admin-subtle"
const adminCardHoverClassName = "hover:bg-admin-bg"

function Card({
  className,
  variant = "default",
  surface,
  shadow,
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    asChild?: boolean
    size?: "default" | "sm"
  }) {
  const Comp = asChild ? Slot.Root : "div"

  return (
    <Comp
      data-slot="card"
      data-variant={variant}
      data-size={variant === "default" ? size : undefined}
      className={cn(cardVariants({ variant, surface, shadow, className }))}
      {...props}
    />
  )
}

export {
  Card,
  cardVariants,
  adminCardFooterClassName,
  adminCardHoverClassName,
}

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const shadcnBadgeClassName =
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!"

const badgeVariants = cva("", {
  variants: {
    variant: {
      default: `${shadcnBadgeClassName} bg-primary text-primary-foreground [a]:hover:bg-primary/80`,
      secondary: `${shadcnBadgeClassName} bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80`,
      destructive: `${shadcnBadgeClassName} bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20`,
      outline: `${shadcnBadgeClassName} border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground`,
      ghost: `${shadcnBadgeClassName} hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50`,
      link: `${shadcnBadgeClassName} text-primary underline-offset-4 hover:underline`,
      theme: "theme-pill",
      "theme-alt": "theme-pill theme-pill-alt",
      status:
        "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2 text-xs font-bold",
      "status-dot": "h-1.5 w-1.5 rounded-full",
      count:
        "inline-flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-point px-1 text-micro font-bold leading-none text-white",
    },
    tone: {
      open: "",
      paused: "",
      fulfilled: "",
      hidden: "",
    },
  },
  compoundVariants: [
    {
      variant: "status",
      tone: "open",
      class: "bg-success-tint text-success-ink",
    },
    {
      variant: "status",
      tone: "paused",
      class: "bg-warn-tint text-warn-ink",
    },
    {
      variant: "status",
      tone: "fulfilled",
      class: "bg-info-tint text-info-ink",
    },
    {
      variant: "status",
      tone: "hidden",
      class: "bg-muted-tint text-zinc-600",
    },
    { variant: "status-dot", tone: "open", class: "bg-success" },
    { variant: "status-dot", tone: "paused", class: "bg-point" },
    { variant: "status-dot", tone: "fulfilled", class: "bg-info" },
    { variant: "status-dot", tone: "hidden", class: "bg-zinc-400" },
  ],
  defaultVariants: {
    variant: "default",
  },
})

function Badge({
  className,
  variant = "default",
  tone,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, tone }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

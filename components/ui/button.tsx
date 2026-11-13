import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const shadcnButtonClassName =
  "shrink-0 rounded-lg border border-transparent bg-clip-padding text-sm font-medium transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const buttonVariants = cva(
  "group/button inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-60",
  {
    variants: {
      variant: {
        default: `${shadcnButtonClassName} bg-primary text-primary-foreground hover:bg-primary/80`,
        outline: `${shadcnButtonClassName} border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50`,
        secondary: `${shadcnButtonClassName} bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground`,
        ghost: `${shadcnButtonClassName} hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50`,
        destructive: `${shadcnButtonClassName} bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40`,
        link: "h-9 bg-transparent text-sm font-semibold text-zinc-500 underline-offset-4 whitespace-normal hover:text-ink hover:underline",
        cta: "min-h-12 max-w-full rounded-md border-2 border-line-strong bg-ink-deep px-5 py-3 text-center text-sm font-black whitespace-normal text-white transition-colors hover:bg-accent-main",
        theme: "theme-btn disabled:pointer-events-auto",
        "theme-primary": "theme-btn theme-btn-primary disabled:pointer-events-auto",
        "theme-accent": "theme-btn theme-btn-accent disabled:pointer-events-auto",
        admin:
          "h-9 rounded-md border border-ink bg-ink px-3.5 text-sm font-semibold whitespace-normal text-white transition-colors hover:bg-black",
        "admin-outline":
          "h-9 rounded-md border border-line bg-white px-3 text-sm font-semibold whitespace-normal text-zinc-800 transition-colors hover:bg-zinc-100",
        danger:
          "h-9 rounded-md border border-danger bg-white px-3 text-sm font-semibold whitespace-normal text-danger transition-colors hover:bg-danger-tint",
        subtle:
          "h-8 rounded-md border border-line bg-white px-3 text-xs font-semibold whitespace-normal text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700",
        kakao:
          "h-12 rounded-md border-2 border-line-strong bg-kakao px-4 text-sm font-black whitespace-normal text-ink transition-colors hover:bg-kakao-hover",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
        "icon-admin": "size-9",
        block: "w-full",
        none: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const selfSizedVariants = new Set<NonNullable<VariantProps<typeof buttonVariants>["variant"]>>([
  "link",
  "cta",
  "theme",
  "theme-primary",
  "theme-accent",
  "admin",
  "admin-outline",
  "danger",
  "subtle",
  "kakao",
])

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const resolvedSize =
    size === "default" && variant && selfSizedVariants.has(variant) ? "none" : size

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={resolvedSize}
      className={cn(buttonVariants({ variant, size: resolvedSize, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

"use client"

import { useRef, useState, type ComponentProps } from "react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const actionButtonClassName = "h-11 flex-1 sm:h-9 sm:flex-none"

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>

type ConfirmDialogSharedProps = {
  tone: "danger" | "default"
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  formId: string
  cancelLabel?: string
}

type ConfirmDialogProps = ConfirmDialogSharedProps &
  (
    | {
        triggerLabel: string
        triggerVariant?: ButtonVariant
        open?: undefined
        onOpenChange?: undefined
      }
    | {
        open: boolean
        onOpenChange: (open: boolean) => void
        triggerLabel?: undefined
        triggerVariant?: undefined
      }
  )

export function ConfirmDialog({
  tone,
  title,
  description,
  confirmLabel,
  pendingLabel,
  formId,
  cancelLabel = "취소",
  ...props
}: ConfirmDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const cancelRef = useRef<HTMLButtonElement>(null)
  const isControlled = props.open !== undefined
  const open = isControlled ? props.open : uncontrolledOpen
  const triggerVariant =
    "triggerVariant" in props && props.triggerVariant
      ? props.triggerVariant
      : "danger"

  function setOpen(nextOpen: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(nextOpen)
    }

    props.onOpenChange?.(nextOpen)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (pendingRef.current && !nextOpen) {
      return
    }

    setOpen(nextOpen)

    if (!nextOpen) {
      pendingRef.current = false
      setPending(false)
    }
  }

  function submitForm() {
    if (pendingRef.current) {
      return
    }

    const form = document.getElementById(formId)
    if (!(form instanceof HTMLFormElement)) {
      return
    }

    pendingRef.current = true
    setPending(true)
    form.requestSubmit()
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      {props.triggerLabel ? (
        <AlertDialogTrigger asChild>
          <Button type="button" variant={triggerVariant}>
            {props.triggerLabel}
          </Button>
        </AlertDialogTrigger>
      ) : null}
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          cancelRef.current?.focus()
        }}
        onCloseAutoFocus={
          isControlled
            ? (event) => {
                event.preventDefault()
              }
            : undefined
        }
        onEscapeKeyDown={(event) => {
          if (pendingRef.current) {
            event.preventDefault()
          }
        }}
      >
        <AlertDialogTitle>{title}</AlertDialogTitle>
        <AlertDialogDescription>{description}</AlertDialogDescription>
        <div className="mt-5 flex gap-2 sm:justify-end">
          <AlertDialogCancel asChild>
            <Button
              ref={cancelRef}
              type="button"
              variant="admin-outline"
              className={actionButtonClassName}
              disabled={pending}
            >
              {cancelLabel}
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              variant={tone === "danger" ? "danger-solid" : "admin"}
              className={actionButtonClassName}
              disabled={pending}
              onClick={(event) => {
                event.preventDefault()
                submitForm()
              }}
            >
              {pending ? pendingLabel : confirmLabel}
            </Button>
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}

"use client"

import { useRef, useState } from "react"
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

type ConfirmDialogProps = {
  tone: "danger" | "default"
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  formId: string
  triggerLabel: string
}

export function ConfirmDialog({
  tone,
  title,
  description,
  confirmLabel,
  pendingLabel,
  formId,
  triggerLabel,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const pendingRef = useRef(false)
  const cancelRef = useRef<HTMLButtonElement>(null)

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
      <AlertDialogTrigger asChild>
        <Button type="button" variant="danger">
          {triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          cancelRef.current?.focus()
        }}
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
              취소
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

"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type AdminToastMessageProps = {
  id: string;
  message: string;
  type?: "error" | "success";
};

export function AdminToastMessage({
  id,
  message,
  type = "error",
}: AdminToastMessageProps) {
  useEffect(() => {
    toast[type](message, { id });
  }, [id, message, type]);

  return null;
}

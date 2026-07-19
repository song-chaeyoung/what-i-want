"use client";

import { useState } from "react";
import { toast } from "sonner";

type LinkPreview = {
  title: string | null;
  imageUrl: string | null;
  price: number | null;
};

export function LinkAutofillButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.closest("form");

    if (!form || loading) {
      return;
    }

    const productUrl = getFieldValue(form, "productUrl");

    if (!productUrl) {
      toast.error("상품 링크를 먼저 입력해 주세요.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/admin/wishes/link-preview?url=${encodeURIComponent(productUrl)}`,
      );

      if (!response.ok) {
        throw new Error(`link preview failed: ${response.status}`);
      }

      const { preview } = (await response.json()) as { preview: LinkPreview };
      const filledCount = fillEmptyFields(form, preview);

      if (filledCount > 0) {
        toast.success("상품 정보를 채웠어요. 저장 전에 확인해 주세요.");
      } else {
        toast.info("가져올 상품 정보를 찾지 못했어요. 직접 입력해 주세요.");
      }
    } catch (error) {
      console.error(error);
      toast.error("상품 정보를 불러오지 못했어요. 직접 입력해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="h-10 shrink-0 rounded-md border border-line bg-white px-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 disabled:opacity-60"
    >
      {loading ? "불러오는 중…" : "정보 불러오기"}
    </button>
  );
}

function getFieldValue(form: HTMLFormElement, name: string): string {
  const field = form.elements.namedItem(name);

  return field instanceof HTMLInputElement ? field.value.trim() : "";
}

// 사용자가 이미 입력한 값은 덮어쓰지 않고 빈 칸만 채운다.
function fillEmptyFields(form: HTMLFormElement, preview: LinkPreview): number {
  const updates: Array<[string, string | null]> = [
    ["title", preview.title],
    ["imageUrl", preview.imageUrl],
    ["targetAmount", preview.price === null ? null : String(preview.price)],
  ];
  let filledCount = 0;

  for (const [name, value] of updates) {
    if (!value) {
      continue;
    }

    const field = form.elements.namedItem(name);

    if (field instanceof HTMLInputElement && field.value.trim() === "") {
      field.value = value;
      filledCount += 1;
    }
  }

  return filledCount;
}

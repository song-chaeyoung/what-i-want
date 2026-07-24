import { Check, Gift, Heart, Link2 } from "lucide-react";
import type { PublicThemeId } from "@/src/lib/wishlist/theme";
import type { AdminGuideStep } from "./admin-guide-state";

type AdminGuideVisualProps = {
  step: AdminGuideStep;
  wishlistSlug: string;
  themeId: PublicThemeId;
};

export function AdminGuideVisual({
  step,
  wishlistSlug,
  themeId,
}: AdminGuideVisualProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none h-[190px] select-none overflow-hidden rounded-md sm:h-[260px]"
    >
      {step === 0 ? <GiftFormVisual /> : null}
      {step === 1 ? <PublicPreviewVisual themeId={themeId} /> : null}
      {step === 2 ? <ShareVisual wishlistSlug={wishlistSlug} /> : null}
    </div>
  );
}

function GiftFormVisual() {
  return (
    <div className="grid h-full content-center gap-3 bg-[#ffe4e6] p-4 sm:p-7">
      <div className="rounded-md border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#111827]">
        <p className="text-[10px] font-bold text-zinc-500">상품 링크</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="min-w-0 flex-1 truncate rounded border border-line bg-[#fafafa] px-2.5 py-2 text-[11px] font-semibold text-zinc-500">
            https://shop.example/gift
          </div>
          <div className="shrink-0 rounded border border-ink bg-yellow-200 px-2.5 py-2 text-[10px] font-black text-ink">
            정보 불러오기
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-md border-2 border-ink bg-paper p-3 shadow-[3px_3px_0_#111827]">
        <div className="grid size-12 shrink-0 place-items-center rounded border border-ink bg-mint sm:size-14">
          <Gift className="size-6 text-teal" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-ink">무선 헤드폰</p>
          <p className="mt-1 text-xs font-bold text-purple">189,000원</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-teal">
          <Check className="size-3.5" />
          자동 입력
        </div>
      </div>
    </div>
  );
}

function PublicPreviewVisual({ themeId }: { themeId: PublicThemeId }) {
  return (
    <div
      className="pub-page grid h-full place-items-center overflow-hidden p-5 sm:p-8"
      data-theme={themeId}
    >
      <div className="pub-card w-full max-w-[430px] p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="pub-pill">NO. 1</span>
          <span className="pub-label">받고 싶은 선물</span>
        </div>
        <p className="mt-4 text-lg font-black text-[var(--pub-headline-color)] sm:text-xl">
          무선 헤드폰
        </p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-base font-black text-[var(--pub-ink)]">
              63,000원
            </p>
            <p className="mt-1 text-[10px] font-bold text-[var(--pub-sub)]">
              189,000원 중
            </p>
          </div>
          <p className="text-xs font-black text-[var(--pub-accent)]">33%</p>
        </div>
        <div className="mt-3 h-3 overflow-hidden rounded-sm border border-[var(--pub-divider-color)] bg-white">
          <div className="h-full w-1/3 bg-[var(--pub-progress-fill)]" />
        </div>
      </div>
    </div>
  );
}

function ShareVisual({ wishlistSlug }: { wishlistSlug: string }) {
  return (
    <div className="grid h-full content-center gap-3 bg-[#fef3c7] p-4 sm:p-7">
      <div className="flex items-center gap-2 rounded-md border-2 border-ink bg-white p-3 shadow-[3px_3px_0_#111827]">
        <Link2 className="size-4 shrink-0 text-purple" />
        <p className="min-w-0 flex-1 truncate text-xs font-bold text-zinc-600">
          /wishlist/{wishlistSlug}
        </p>
        <div className="flex shrink-0 items-center gap-1 rounded border border-ink bg-mint px-2.5 py-2 text-[10px] font-black text-teal">
          <Check className="size-3.5" />
          링크 복사
        </div>
      </div>
      <div className="ml-auto flex w-[85%] items-start gap-3 rounded-md border-2 border-ink bg-[#ffe4e6] p-3 shadow-[3px_3px_0_#111827]">
        <div className="grid size-9 shrink-0 place-items-center rounded border border-ink bg-white">
          <Heart className="size-4 fill-rose-400 text-rose-500" />
        </div>
        <div>
          <p className="text-xs font-black text-ink">새로운 마음이 도착했어요</p>
          <p className="mt-1 text-[11px] font-semibold text-zinc-600">
            생일 진심으로 축하해!
          </p>
        </div>
      </div>
    </div>
  );
}

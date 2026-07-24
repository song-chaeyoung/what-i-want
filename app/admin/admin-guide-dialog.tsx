"use client";

import { useRef, useState } from "react";
import type { TouchEvent } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { PublicThemeId } from "@/src/lib/wishlist/theme";
import {
  adminPrimaryButtonClassName,
  adminSecondaryButtonClassName,
} from "./admin-ui";
import {
  getAdminGuideQueryTransition,
  getAdminGuideStepAfterSwipe,
  getNextAdminGuideStep,
  getPreviousAdminGuideStep,
  type AdminGuideStep,
} from "./admin-guide-state";
import { requestAdminGuideCompletion } from "./admin-guide-request";
import { AdminGuideVisual } from "./admin-guide-visual";

const guideSteps = [
  {
    progress: "01 / 03",
    title: "갖고 싶은 선물을 담아요",
    description:
      "선물 링크를 넣으면 이미지, 이름, 가격을 빠르게 채울 수 있어요.",
  },
  {
    progress: "02 / 03",
    title: "친구에게 보일 페이지를 확인해요",
    description:
      "등록한 선물이 친구들에게 어떻게 보이는지 미리 확인해보세요.",
  },
  {
    progress: "03 / 03",
    title: "링크를 보내고 마음을 기다려요",
    description:
      "위시리스트 링크를 공유하면 친구가 로그인 없이 마음을 보낼 수 있어요.",
  },
] as const;

type AdminGuideDialogProps = {
  initialOpen: boolean;
  wishlistSlug: string;
  themeId: PublicThemeId;
};

type CompletionIntent = "first-gift" | "dismiss";
type TransitionDirection = "next" | "previous";

export function AdminGuideDialog({
  initialOpen,
  wishlistSlug,
  themeId,
}: AdminGuideDialogProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const guideRequested = searchParams.get("guide") === "1";
  const [open, setOpen] = useState(initialOpen || guideRequested);
  const [step, setStep] = useState<AdminGuideStep>(0);
  const [direction, setDirection] = useState<TransitionDirection>("next");
  const [saving, setSaving] = useState(false);
  const [previousGuideRequested, setPreviousGuideRequested] =
    useState(guideRequested);
  const touchStartXRef = useRef<number | null>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const currentStep = guideSteps[step];

  if (guideRequested !== previousGuideRequested) {
    const queryTransition = getAdminGuideQueryTransition({
      initialOpen,
      previousGuideRequested,
      guideRequested,
    });

    setPreviousGuideRequested(guideRequested);

    if (queryTransition === "open") {
      setStep(0);
      setDirection("next");
      setOpen(true);
    } else if (queryTransition === "close") {
      setOpen(false);
    }
  }

  function goNext() {
    setDirection("next");
    setStep((current) => getNextAdminGuideStep(current));
  }

  function goPrevious() {
    setDirection("previous");
    setStep((current) => getPreviousAdminGuideStep(current));
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current;
    const endX = event.changedTouches[0]?.clientX;
    touchStartXRef.current = null;

    if (startX === null || endX === undefined) {
      return;
    }

    const deltaX = endX - startX;
    const nextStep = getAdminGuideStepAfterSwipe(step, deltaX);

    if (nextStep === step) {
      return;
    }

    setDirection(nextStep > step ? "next" : "previous");
    setStep(nextStep);
  }

  async function completeGuide(intent: CompletionIntent) {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const completionStatus = await requestAdminGuideCompletion();

      if (completionStatus === "unauthorized") {
        toast.error("로그인이 만료되었습니다. 다시 로그인해주세요.");
        router.push("/login");
        return;
      }

      if (completionStatus === "error") {
        throw new Error("guide completion failed");
      }

      if (intent === "first-gift") {
        setOpen(false);
        router.push("/admin/wishes?create=1#create-wish");
        return;
      }

      setOpen(false);
      removeGuideQuery();
    } catch (error) {
      console.error(error);
      toast.error("안내 상태를 저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  function removeGuideQuery() {
    if (!guideRequested) {
      return;
    }

    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.delete("guide");
    const nextQuery = nextParams.toString();
    const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function handleEscapeKeyDown(event: KeyboardEvent) {
    event.preventDefault();
    void completeGuide("dismiss");
  }

  const motionClassName =
    direction === "next"
      ? "slide-in-from-right-2"
      : "slide-in-from-left-2";

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className="fixed top-1/2 left-1/2 z-50 grid max-h-[calc(100dvh-16px)] w-[calc(100%-16px)] max-w-[760px] -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto rounded-md border-2 border-ink bg-paper p-4 shadow-[7px_7px_0_#111827] outline-none sm:p-7"
          onPointerDownOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={handleEscapeKeyDown}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            primaryActionRef.current?.focus();
          }}
        >
          <div className="flex items-start justify-between gap-4 pr-9">
            <div>
              <p className="text-xs font-black text-purple">
                {currentStep.progress}
              </p>
              <DialogPrimitive.Title className="mt-2 text-2xl font-black tracking-tight text-ink sm:text-3xl">
                이제 위시리스트를 만들어볼까요?
              </DialogPrimitive.Title>
            </div>
            <button
              type="button"
              aria-label="안내 닫기"
              disabled={saving}
              onClick={() => void completeGuide("dismiss")}
              className="absolute top-4 right-4 grid size-9 place-items-center rounded-md border border-line bg-white text-zinc-600 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50 sm:top-6 sm:right-6"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>

          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="touch-pan-y"
          >
            <p
              className="sr-only"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              {currentStep.progress}: {currentStep.title}.{" "}
              {currentStep.description}
            </p>
            <div
              key={step}
              className={`animate-in fade-in ${motionClassName} duration-200 motion-reduce:animate-none`}
            >
              <AdminGuideVisual
                step={step}
                wishlistSlug={wishlistSlug}
                themeId={themeId}
              />
              <div className="mt-4">
                <h2 className="text-lg font-black text-ink sm:text-xl">
                  {currentStep.title}
                </h2>
                <DialogPrimitive.Description className="mt-2 text-sm font-medium leading-6 text-zinc-600">
                  {currentStep.description}
                </DialogPrimitive.Description>
              </div>
            </div>
          </div>

          <div
            className="flex items-center justify-center gap-2"
            aria-hidden="true"
          >
            {guideSteps.map((guideStep, index) => (
              <span
                key={guideStep.progress}
                className={`h-2.5 rounded-full transition-[width,background-color] motion-reduce:transition-none ${
                  index === step ? "w-7 bg-purple" : "w-2.5 bg-zinc-300"
                }`}
              />
            ))}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={saving}
              onClick={() => void completeGuide("dismiss")}
              className="h-9 text-sm font-semibold text-zinc-500 underline-offset-4 hover:text-ink hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              관리 화면 먼저 둘러보기
            </button>

            <div className="flex justify-end gap-2">
              {step > 0 ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={goPrevious}
                  className={adminSecondaryButtonClassName}
                >
                  <ArrowLeft aria-hidden="true" className="size-4" />
                  이전
                </button>
              ) : null}

              {step < 2 ? (
                <button
                  ref={primaryActionRef}
                  type="button"
                  disabled={saving}
                  onClick={goNext}
                  className={adminPrimaryButtonClassName}
                >
                  다음
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              ) : (
                <button
                  ref={primaryActionRef}
                  type="button"
                  disabled={saving}
                  onClick={() => void completeGuide("first-gift")}
                  className={adminPrimaryButtonClassName}
                >
                  {saving ? "처리 중..." : "첫 선물 담기"}
                </button>
              )}
            </div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export type AdminGuideStep = 0 | 1 | 2;

type AdminGuideQueryTransition = "open" | "close" | "preserve";

type AdminGuideQueryTransitionInput = {
  initialOpen: boolean;
  previousGuideRequested: boolean;
  guideRequested: boolean;
};

export const ADMIN_GUIDE_SWIPE_THRESHOLD = 48;

export function getAdminGuideQueryTransition({
  initialOpen,
  previousGuideRequested,
  guideRequested,
}: AdminGuideQueryTransitionInput): AdminGuideQueryTransition {
  if (guideRequested === previousGuideRequested) {
    return "preserve";
  }

  if (guideRequested) {
    return "open";
  }

  return initialOpen ? "preserve" : "close";
}

export function getNextAdminGuideStep(
  step: AdminGuideStep,
): AdminGuideStep {
  return step === 2 ? 2 : ((step + 1) as AdminGuideStep);
}

export function getPreviousAdminGuideStep(
  step: AdminGuideStep,
): AdminGuideStep {
  return step === 0 ? 0 : ((step - 1) as AdminGuideStep);
}

export function getAdminGuideStepAfterSwipe(
  step: AdminGuideStep,
  deltaX: number,
): AdminGuideStep {
  if (Math.abs(deltaX) < ADMIN_GUIDE_SWIPE_THRESHOLD) {
    return step;
  }

  return deltaX < 0
    ? getNextAdminGuideStep(step)
    : getPreviousAdminGuideStep(step);
}

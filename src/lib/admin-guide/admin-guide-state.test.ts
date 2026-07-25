import { describe, expect, test } from "vitest";
import {
  getAdminGuideQueryTransition,
  getAdminGuideStepAfterSwipe,
  getNextAdminGuideStep,
  getPreviousAdminGuideStep,
} from "@/app/admin/admin-guide-state";

describe("admin guide step state", () => {
  test("moves forward without passing the final step", () => {
    expect(getNextAdminGuideStep(0)).toBe(1);
    expect(getNextAdminGuideStep(1)).toBe(2);
    expect(getNextAdminGuideStep(2)).toBe(2);
  });

  test("moves backward without passing the first step", () => {
    expect(getPreviousAdminGuideStep(2)).toBe(1);
    expect(getPreviousAdminGuideStep(1)).toBe(0);
    expect(getPreviousAdminGuideStep(0)).toBe(0);
  });

  test("requires a 48 pixel horizontal swipe", () => {
    expect(getAdminGuideStepAfterSwipe(1, -47)).toBe(1);
    expect(getAdminGuideStepAfterSwipe(1, 47)).toBe(1);
    expect(getAdminGuideStepAfterSwipe(1, -48)).toBe(2);
    expect(getAdminGuideStepAfterSwipe(1, 48)).toBe(0);
  });

  test("keeps swipe navigation inside the three-step range", () => {
    expect(getAdminGuideStepAfterSwipe(0, 100)).toBe(0);
    expect(getAdminGuideStepAfterSwipe(2, -100)).toBe(2);
  });
});

describe("admin guide query state", () => {
  test("opens the guide when the query changes from absent to requested", () => {
    expect(
      getAdminGuideQueryTransition({
        initialOpen: false,
        previousGuideRequested: false,
        guideRequested: true,
      }),
    ).toBe("open");
  });

  test("closes a manually opened guide when browser navigation removes the query", () => {
    expect(
      getAdminGuideQueryTransition({
        initialOpen: false,
        previousGuideRequested: true,
        guideRequested: false,
      }),
    ).toBe("close");
  });

  test("preserves the automatic first-entry guide when only the query is removed", () => {
    expect(
      getAdminGuideQueryTransition({
        initialOpen: true,
        previousGuideRequested: true,
        guideRequested: false,
      }),
    ).toBe("preserve");
  });
});

/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

beforeAll(() => {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false;
    Element.prototype.setPointerCapture = () => {};
    Element.prototype.releasePointerCapture = () => {};
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

afterEach(() => {
  cleanup();
});

const shared = {
  tone: "danger" as const,
  title: "제목",
  description: "설명",
  confirmLabel: "진행",
  pendingLabel: "진행하는 중…",
  formId: "target-form",
};

describe("ConfirmDialog props", () => {
  test("defaults the trigger to danger and the cancel label to 취소", () => {
    render(
      <form id="target-form">
        <ConfirmDialog {...shared} triggerLabel="열기" />
      </form>,
    );

    const trigger = screen.getByRole("button", { name: "열기" });
    expect(trigger.getAttribute("data-variant")).toBe("danger");

    fireEvent.click(trigger);

    const cancel = screen.getByRole("button", { name: "취소" });
    expect(cancel.getAttribute("data-variant")).toBe("admin-outline");
    expect(document.activeElement).toBe(cancel);
  });

  test("uses triggerVariant and cancelLabel when they are passed", () => {
    render(
      <form id="target-form">
        <ConfirmDialog
          {...shared}
          tone="default"
          triggerLabel="숨기기"
          triggerVariant="subtle"
          cancelLabel="연도 고치기"
          confirmLabel="숨기기"
        />
      </form>,
    );

    const trigger = screen.getByRole("button", { name: "숨기기" });
    expect(trigger.getAttribute("data-variant")).toBe("subtle");

    fireEvent.click(trigger);

    expect(screen.getByRole("button", { name: "연도 고치기" })).toBeTruthy();
    expect(
      screen
        .getByRole("alertdialog")
        .querySelector('[data-variant="admin"]')
        ?.textContent,
    ).toBe("숨기기");
  });

  test("controlled mode has no trigger and reports closing", () => {
    const onOpenChange = vi.fn();
    const { rerender } = render(
      <form id="target-form">
        <ConfirmDialog
          {...shared}
          title="2015년생이 맞나요?"
          cancelLabel="연도 고치기"
          open={false}
          onOpenChange={onOpenChange}
        />
      </form>,
    );

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.queryByRole("alertdialog")).toBeNull();

    rerender(
      <form id="target-form">
        <ConfirmDialog
          {...shared}
          title="2015년생이 맞나요?"
          cancelLabel="연도 고치기"
          open
          onOpenChange={onOpenChange}
        />
      </form>,
    );

    expect(screen.queryByRole("button", { name: "열기" })).toBeNull();
    expect(
      screen.getByRole("alertdialog", { name: "2015년생이 맞나요?" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "연도 고치기" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  test("confirm submits the named form and keeps both buttons disabled", () => {
    let submitted = 0;

    render(
      <form
        id="target-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitted += 1;
        }}
      >
        <input name="birthday" defaultValue="2015-03-15" />
        <ConfirmDialog
          {...shared}
          confirmLabel="이 생일로 제출"
          pendingLabel="제출하는 중…"
          cancelLabel="연도 고치기"
          open
          onOpenChange={() => {}}
        />
      </form>,
    );

    fireEvent.click(screen.getByRole("button", { name: "이 생일로 제출" }));

    expect(submitted).toBe(1);
    expect(
      (screen.getByRole("button", { name: "제출하는 중…" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      (screen.getByRole("button", { name: "연도 고치기" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });
});

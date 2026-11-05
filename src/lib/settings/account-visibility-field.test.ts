import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { AccountVisibilityField } from "@/app/admin/settings/account-visibility-field";

describe("account visibility field", () => {
  test("explains copy guidance and stays disabled until an account is saved", () => {
    const html = renderToStaticMarkup(
      createElement(AccountVisibilityField, {
        defaultVisibility: "copy_only",
        disabled: true,
      }),
    );

    expect(html).toContain("계좌 공개");
    expect(html).toContain(
      "공개 페이지를 방문한 사람은 계좌번호를 복사할 수 있어요.",
    );
    expect(html).toContain('name="accountVisibility"');
    expect(html).toContain('value="copy_only" selected=""');
    expect(html).toContain("숨기기");
    expect(html).toContain('disabled=""');
    expect(html).toContain("border-line");
  });

  test("explains that a hidden account stays off the public page", () => {
    const html = renderToStaticMarkup(
      createElement(AccountVisibilityField, {
        defaultVisibility: "hidden",
        disabled: false,
      }),
    );

    expect(html).toContain("공개 페이지에 계좌가 보이지 않아요.");
    expect(html).toContain('value="hidden" selected=""');
    expect(html).not.toContain("disabled");
  });
});

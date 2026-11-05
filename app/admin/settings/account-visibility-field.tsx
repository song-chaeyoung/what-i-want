"use client";

import { useState } from "react";
import { ADMIN_COPY } from "@/src/lib/design/copy";
import { AdminField, adminInputClassName } from "../admin-ui";

const selectableAccountVisibilities = ["copy_only", "hidden"] as const;

type SelectableAccountVisibility = (typeof selectableAccountVisibilities)[number];

const accountVisibilityLabels: Record<SelectableAccountVisibility, string> = {
  copy_only: "공개 페이지에 보이기",
  hidden: "숨기기",
};

const accountVisibilityHints: Record<SelectableAccountVisibility, string> = {
  copy_only: ADMIN_COPY.accountVisibilityCopyOnlyHint,
  hidden: ADMIN_COPY.accountVisibilityHiddenHint,
};

export function AccountVisibilityField({
  defaultVisibility,
  disabled,
}: {
  defaultVisibility: SelectableAccountVisibility;
  disabled: boolean;
}) {
  const [visibility, setVisibility] = useState(defaultVisibility);

  return (
    <AdminField
      label="계좌 공개"
      htmlFor="accountVisibility"
      hint={accountVisibilityHints[visibility]}
    >
      <select
        id="accountVisibility"
        name="accountVisibility"
        value={visibility}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.value;

          if (next === "copy_only" || next === "hidden") {
            setVisibility(next);
          }
        }}
        className={adminInputClassName}
      >
        {selectableAccountVisibilities.map((option) => (
          <option key={option} value={option}>
            {accountVisibilityLabels[option]}
          </option>
        ))}
      </select>
    </AdminField>
  );
}

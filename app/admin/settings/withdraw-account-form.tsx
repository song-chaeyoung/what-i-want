"use client";

import { WITHDRAWAL_COPY } from "@/src/lib/design/copy";

export function WithdrawAccountForm() {
  return (
    <form
      id="withdraw-account-form"
      action="/api/admin/account/withdraw"
      method="post"
      className="hidden"
      onSubmit={(event) => {
        if (!window.confirm(WITHDRAWAL_COPY.confirm)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="_method" value="delete" />
    </form>
  );
}

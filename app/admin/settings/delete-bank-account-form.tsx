"use client";

import { ADMIN_COPY } from "@/src/lib/design/copy";

export function DeleteBankAccountForm() {
  return (
    <form
      id="delete-bank-account-form"
      action="/api/admin/settings/bank-account"
      method="post"
      className="hidden"
      onSubmit={(event) => {
        if (!window.confirm(ADMIN_COPY.deleteBankAccountConfirm)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="_method" value="delete" />
    </form>
  );
}

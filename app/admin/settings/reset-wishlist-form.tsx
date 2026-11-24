import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ADMIN_COPY } from "@/src/lib/design/copy";

export function ResetWishlistForm() {
  return (
    <>
      <form
        id="reset-wishlist-form"
        action="/api/admin/wishlist/reset"
        method="post"
        className="hidden"
      />
      <ConfirmDialog
        tone="danger"
        title={ADMIN_COPY.resetWishlistConfirm.title}
        description={ADMIN_COPY.resetWishlistConfirm.description}
        confirmLabel={ADMIN_COPY.resetWishlistConfirm.confirm}
        pendingLabel={ADMIN_COPY.resetWishlistConfirm.pending}
        formId="reset-wishlist-form"
        triggerLabel={ADMIN_COPY.resetWishlistButton}
      />
    </>
  );
}

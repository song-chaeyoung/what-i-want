import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ADMIN_COPY } from "@/src/lib/design/copy";

export function DeleteWishForm({
  wishId,
  hasAmount,
}: {
  wishId: string;
  hasAmount: boolean;
}) {
  const formId = `delete-wish-${wishId}`;

  return (
    <>
      <form
        id={formId}
        action={`/api/admin/wishes/${wishId}`}
        method="post"
        className="hidden"
      >
        <input type="hidden" name="_method" value="delete" />
      </form>
      <div className="mt-3">
        <ConfirmDialog
          tone="danger"
          title={ADMIN_COPY.deleteWishConfirm.title}
          description={
            hasAmount
              ? ADMIN_COPY.deleteWishConfirm.descriptionWithAmount
              : ADMIN_COPY.deleteWishConfirm.descriptionWithoutAmount
          }
          confirmLabel={ADMIN_COPY.deleteWishConfirm.confirm}
          pendingLabel={ADMIN_COPY.deleteWishConfirm.pending}
          formId={formId}
          triggerLabel={ADMIN_COPY.deleteWishButton}
        />
      </div>
    </>
  );
}

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ADMIN_COPY } from "@/src/lib/design/copy";

export function HideMessageForm({
  messageId,
  hasAmount,
}: {
  messageId: string;
  hasAmount: boolean;
}) {
  const formId = `hide-message-${messageId}`;

  return (
    <>
      <form
        id={formId}
        action={`/api/admin/messages/${messageId}`}
        method="post"
        className="hidden"
      >
        <input type="hidden" name="intent" value="hide" />
      </form>
      <ConfirmDialog
        tone="default"
        triggerVariant="subtle"
        title={ADMIN_COPY.hideMessageConfirm.title}
        description={
          hasAmount
            ? ADMIN_COPY.hideMessageConfirm.descriptionWithAmount
            : ADMIN_COPY.hideMessageConfirm.descriptionWithoutAmount
        }
        confirmLabel={ADMIN_COPY.hideMessageConfirm.confirm}
        pendingLabel={ADMIN_COPY.hideMessageConfirm.pending}
        formId={formId}
        triggerLabel={ADMIN_COPY.hideMessageButton}
      />
    </>
  );
}

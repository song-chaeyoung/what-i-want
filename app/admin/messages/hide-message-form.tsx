"use client";

export function HideMessageForm({
  messageId,
  hasAmount,
}: {
  messageId: string;
  hasAmount: boolean;
}) {
  const confirmMessage = hasAmount
    ? "이 참여 기록을 숨길까요? 함께 보낸 마음 금액은 모인 금액에서 빠지고, 숨긴 메시지 목록에서 복구할 수 있어요."
    : "이 메시지를 숨길까요? 숨긴 메시지 목록에서 복구할 수 있어요.";

  return (
    <form
      action={`/api/admin/messages/${messageId}`}
      method="post"
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="h-8 rounded-md border border-line bg-white px-3 text-xs font-semibold text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
      >
        숨기기
      </button>
    </form>
  );
}

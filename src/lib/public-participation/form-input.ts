export type PublicParticipationFormInput = {
  wishItemId: string;
  senderName: string | null;
  body: string | null;
  amount: string | null;
  clientRequestId: string | null;
};

export function readPublicParticipationFormInput(
  formData: FormData,
): PublicParticipationFormInput {
  return {
    wishItemId: getFormString(formData, "wishItemId") ?? "",
    senderName: getFormString(formData, "senderName"),
    body: getFormString(formData, "body"),
    amount: getFormString(formData, "amount"),
    clientRequestId: getFormString(formData, "clientRequestId"),
  };
}

function getFormString(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

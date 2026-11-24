export function DeleteBankAccountForm() {
  return (
    <form
      id="delete-bank-account-form"
      action="/api/admin/settings/bank-account"
      method="post"
      className="hidden"
    >
      <input type="hidden" name="_method" value="delete" />
    </form>
  );
}

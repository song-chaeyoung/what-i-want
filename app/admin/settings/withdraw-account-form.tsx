export function WithdrawAccountForm() {
  return (
    <form
      id="withdraw-account-form"
      action="/api/admin/account/withdraw"
      method="post"
      className="hidden"
    >
      <input type="hidden" name="_method" value="delete" />
    </form>
  );
}

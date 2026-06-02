import Link from "next/link";
import { requireUser } from "@/src/lib/auth/require-user";
import { PUBLIC_THEME_IDS, type PublicThemeId } from "@/src/lib/wishlist/theme";
import { ACCOUNT_VISIBILITIES, type AccountVisibility } from "@/src/lib/settings/types";
import { DrizzleSettingsRepository } from "@/src/lib/settings/repository";
import { getSettings, type SettingsError } from "@/src/lib/settings/service";

type AdminSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    saved?: string;
  }>;
};

const errorMessages: Record<SettingsError, string> = {
  settings_not_found: "먼저 온보딩을 완료해주세요.",
  display_name_required: "이름을 입력해주세요.",
  display_name_too_long: "이름은 80자 이하여야 합니다.",
  wishlist_title_required: "위시리스트 제목을 입력해주세요.",
  wishlist_title_too_long: "위시리스트 제목은 120자 이하여야 합니다.",
  invalid_slug: "공개 주소는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다.",
  duplicate_slug: "이미 사용 중인 공개 주소입니다.",
  invalid_birthday: "생일 날짜 형식을 확인해주세요.",
  invalid_theme: "지원하지 않는 공개 테마입니다.",
  invalid_account_visibility: "지원하지 않는 계좌 공개 방식입니다.",
  bank_name_required: "은행 이름을 입력해주세요.",
  account_holder_required: "예금주를 입력해주세요.",
  account_number_required: "계좌번호를 입력해주세요.",
  account_field_too_long: "계좌 정보는 80자 이하여야 합니다.",
  account_encryption_unavailable: "계좌 암호화 키가 설정되어 있지 않습니다.",
};

const themeLabels: Record<PublicThemeId, string> = {
  pixel_y2k: "픽셀 Y2K",
  mono_bw: "모노 흑백",
  soft_pastel: "소프트 파스텔",
};

const accountVisibilityLabels: Record<AccountVisibility, string> = {
  hidden: "숨김",
  reveal_on_click: "눌러서 보기",
  copy_only: "복사용",
  always_visible: "항상 표시",
};

export default async function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  const user = await requireUser();
  const [params, result] = await Promise.all([
    searchParams,
    getSettings(user.id, new DrizzleSettingsRepository()),
  ]);

  const errorMessage = params.error
    ? errorMessages[params.error as SettingsError] ?? errorMessages.settings_not_found
    : null;

  if (!result.ok) {
    return (
      <section>
        <div className="rounded-md border border-orange/40 bg-[#fff7ed] p-5 text-sm font-medium text-[#9a3412]">
          {errorMessages[result.error]}
        </div>
      </section>
    );
  }

  const { settings } = result;

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal">
            /b/{settings.wishlist.slug}
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-normal">설정</h2>
        </div>
        <Link
          href={`/b/${settings.wishlist.slug}`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-line bg-white px-4 text-sm font-semibold text-zinc-800 transition-colors hover:bg-zinc-100"
        >
          공개 페이지 보기
        </Link>
      </div>

      {params.saved ? (
        <p className="rounded-md border border-teal/30 bg-[#ecfdf5] px-4 py-3 text-sm font-medium text-teal">
          설정이 저장되었습니다.
        </p>
      ) : null}

      {errorMessage ? (
        <p className="rounded-md border border-orange/40 bg-[#fff7ed] px-4 py-3 text-sm font-medium text-[#9a3412]">
          {errorMessage}
        </p>
      ) : null}

      <form
        action="/api/admin/settings"
        method="post"
        className="grid gap-6 lg:grid-cols-[1fr_1fr]"
      >
        <section className="rounded-md border border-line bg-white p-5 shadow-pub">
          <div className="border-b border-line pb-4">
            <h3 className="text-lg font-bold tracking-normal">프로필</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              공개 페이지에 보이는 기본 소개를 정리합니다.
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <Field
              label="이름"
              htmlFor="displayName"
              badge="필수"
              hint="80자 이내로 표시됩니다."
            >
              <input
                id="displayName"
                name="displayName"
                type="text"
                maxLength={80}
                required
                defaultValue={settings.profile.displayName}
                className={inputClassName}
              />
            </Field>

            <Field label="생일" htmlFor="birthday" badge="선택" hint="공개 페이지 안내에 사용됩니다.">
              <input
                id="birthday"
                name="birthday"
                type="date"
                defaultValue={settings.profile.birthday ?? ""}
                className={inputClassName}
              />
            </Field>

            <Field label="소개" htmlFor="description" badge="선택" hint="짧게 비워두어도 됩니다.">
              <textarea
                id="description"
                name="description"
                rows={4}
                defaultValue={settings.profile.description ?? ""}
                className={textareaClassName}
              />
            </Field>
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-pub">
          <div className="border-b border-line pb-4">
            <h3 className="text-lg font-bold tracking-normal">공개 페이지</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              방문자가 보는 주소, 제목, 테마를 관리합니다.
            </p>
          </div>
          <div className="mt-5 space-y-4">
            <Field
              label="공개 주소"
              htmlFor="wishlistSlug"
              badge="필수"
              hint="영문 소문자, 숫자, 하이픈만 사용할 수 있습니다."
            >
              <div className="flex overflow-hidden rounded-md border border-line bg-[#f9fafb] focus-within:border-zinc-400">
                <span className="inline-flex items-center border-r border-line px-3 text-sm font-semibold text-zinc-600">
                  /b/
                </span>
                <input
                  id="wishlistSlug"
                  name="wishlistSlug"
                  type="text"
                  minLength={3}
                  maxLength={32}
                  required
                  defaultValue={settings.wishlist.slug}
                  className="h-10 w-full bg-white px-3 text-sm text-zinc-800 outline-none"
                />
              </div>
            </Field>

            <Field label="제목" htmlFor="wishlistTitle" badge="필수" hint="120자 이내로 입력해주세요.">
              <input
                id="wishlistTitle"
                name="wishlistTitle"
                type="text"
                maxLength={120}
                required
                defaultValue={settings.wishlist.title}
                className={inputClassName}
              />
            </Field>

            <Field label="테마" htmlFor="themeId" badge="필수" hint="공개 페이지에만 적용됩니다.">
              <select
                id="themeId"
                name="themeId"
                defaultValue={settings.wishlist.themeId}
                className={inputClassName}
              >
                {PUBLIC_THEME_IDS.map((themeId) => (
                  <option key={themeId} value={themeId}>
                    {themeLabels[themeId]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-md border border-line bg-white p-5 shadow-pub lg:col-span-2">
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            <div className="border-b border-line pb-4 lg:border-b-0 lg:border-r lg:pr-5">
              <h3 className="text-lg font-bold tracking-normal">계좌 안내</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                계좌번호는 저장 전에 암호화됩니다.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="은행" htmlFor="bankName" badge="선택" hint="계좌를 공개할 때 필요합니다.">
                <input
                  id="bankName"
                  name="bankName"
                  type="text"
                  maxLength={80}
                  defaultValue={settings.bankAccount?.bankName ?? ""}
                  className={inputClassName}
                />
              </Field>

              <Field label="예금주" htmlFor="accountHolder" badge="선택" hint="계좌를 공개할 때 필요합니다.">
                <input
                  id="accountHolder"
                  name="accountHolder"
                  type="text"
                  maxLength={80}
                  defaultValue={settings.bankAccount?.accountHolder ?? ""}
                  className={inputClassName}
                />
              </Field>

              <Field
                label="계좌번호"
                htmlFor="accountNumber"
                badge="선택"
                hint="기존 계좌는 변경할 때만 다시 입력합니다."
              >
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder={
                    settings.bankAccount ? "변경할 때만 입력" : "3333-12-1234567"
                  }
                  className={inputClassName}
                />
              </Field>

              <Field label="공개 방식" htmlFor="accountVisibility" badge="필수" hint="방문자에게 보이는 방식을 정합니다.">
                <select
                  id="accountVisibility"
                  name="accountVisibility"
                  defaultValue={settings.bankAccount?.visibility ?? "hidden"}
                  className={inputClassName}
                >
                  {ACCOUNT_VISIBILITIES.map((visibility) => (
                    <option key={visibility} value={visibility}>
                      {accountVisibilityLabels[visibility]}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </section>

        <div className="lg:col-span-2">
          <button
            type="submit"
            className="h-11 rounded-md border border-ink bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            저장하기
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  badge,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  badge?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-zinc-700">
          {label}
        </label>
        {badge ? (
          <span className="rounded-full border border-line bg-[#fafaf9] px-2 py-0.5 text-xs font-semibold text-zinc-500">
            {badge}
          </span>
        ) : null}
      </div>
      {children}
      {hint ? <p className="text-xs leading-5 text-zinc-500">{hint}</p> : null}
    </div>
  );
}

const inputClassName =
  "h-10 w-full rounded-md border border-line bg-white px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

const textareaClassName =
  "w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

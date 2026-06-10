import { requireUser } from "@/src/lib/auth/require-user";
import { PUBLIC_THEME_IDS, type PublicThemeId } from "@/src/lib/wishlist/theme";
import { ACCOUNT_VISIBILITIES, type AccountVisibility } from "@/src/lib/settings/types";
import { DrizzleSettingsRepository } from "@/src/lib/settings/repository";
import { getSettings, type SettingsError } from "@/src/lib/settings/service";
import { AdminToastMessage } from "../admin-toast-message";
import {
  AdminField,
  adminInputClassName,
  adminPrimaryButtonClassName,
  adminTextareaClassName,
} from "../admin-ui";

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

export default async function AdminSettingsPage() {
  const user = await requireUser();
  const result = await getSettings(user.id, new DrizzleSettingsRepository());

  if (!result.ok) {
    return (
      <section>
        <AdminToastMessage
          id={`admin-settings-${result.error}`}
          message={errorMessages[result.error]}
        />
      </section>
    );
  }

  const { settings } = result;

  return (
    <section className="space-y-4">
      <form action="/api/admin/settings" method="post" className="space-y-4">
        <SettingsSection
          title="프로필"
          description="공개 페이지에 보이는 기본 소개를 정리합니다."
        >
          <SettingsRow>
            <AdminField
              label="이름"
              htmlFor="displayName"
              required
              hint="80자 이내로 표시됩니다."
            >
              <input
                id="displayName"
                name="displayName"
                type="text"
                maxLength={80}
                required
                defaultValue={settings.profile.displayName}
                className={adminInputClassName}
              />
            </AdminField>
          </SettingsRow>
          <SettingsRow>
            <AdminField label="생일" htmlFor="birthday" hint="공개 페이지 안내에 사용됩니다.">
              <input
                id="birthday"
                name="birthday"
                type="date"
                defaultValue={settings.profile.birthday ?? ""}
                className={adminInputClassName}
              />
            </AdminField>
          </SettingsRow>
          <SettingsRow>
            <AdminField label="소개" htmlFor="description" hint="짧게 비워두어도 됩니다.">
              <textarea
                id="description"
                name="description"
                rows={3}
                defaultValue={settings.profile.description ?? ""}
                className={adminTextareaClassName}
              />
            </AdminField>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title="공개 페이지"
          description="방문자가 보는 주소, 제목, 테마를 관리합니다."
        >
          <SettingsRow>
            <AdminField
              label="공개 주소"
              htmlFor="wishlistSlug"
              required
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
            </AdminField>
          </SettingsRow>
          <SettingsRow>
            <AdminField label="제목" htmlFor="wishlistTitle" required hint="120자 이내로 입력해주세요.">
              <input
                id="wishlistTitle"
                name="wishlistTitle"
                type="text"
                maxLength={120}
                required
                defaultValue={settings.wishlist.title}
                className={adminInputClassName}
              />
            </AdminField>
          </SettingsRow>
          <SettingsRow>
            <AdminField label="테마" htmlFor="themeId" required hint="공개 페이지에만 적용됩니다.">
              <select
                id="themeId"
                name="themeId"
                defaultValue={settings.wishlist.themeId}
                className={adminInputClassName}
              >
                {PUBLIC_THEME_IDS.map((themeId) => (
                  <option key={themeId} value={themeId}>
                    {themeLabels[themeId]}
                  </option>
                ))}
              </select>
            </AdminField>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection
          title="계좌 안내"
          description="계좌번호는 저장 전에 암호화됩니다."
        >
          <SettingsRow>
            <AdminField label="은행" htmlFor="bankName" hint="계좌를 공개할 때 필요합니다.">
              <input
                id="bankName"
                name="bankName"
                type="text"
                maxLength={80}
                defaultValue={settings.bankAccount?.bankName ?? ""}
                className={adminInputClassName}
              />
            </AdminField>
          </SettingsRow>
          <SettingsRow>
            <AdminField label="예금주" htmlFor="accountHolder" hint="계좌를 공개할 때 필요합니다.">
              <input
                id="accountHolder"
                name="accountHolder"
                type="text"
                maxLength={80}
                defaultValue={settings.bankAccount?.accountHolder ?? ""}
                className={adminInputClassName}
              />
            </AdminField>
          </SettingsRow>
          <SettingsRow>
            <AdminField
              label="계좌번호"
              htmlFor="accountNumber"
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
                className={adminInputClassName}
              />
            </AdminField>
          </SettingsRow>
          <SettingsRow>
            <AdminField label="공개 방식" htmlFor="accountVisibility" required hint="방문자에게 보이는 방식을 정합니다.">
              <select
                id="accountVisibility"
                name="accountVisibility"
                defaultValue={settings.bankAccount?.visibility ?? "hidden"}
                className={adminInputClassName}
              >
                {ACCOUNT_VISIBILITIES.map((visibility) => (
                  <option key={visibility} value={visibility}>
                    {accountVisibilityLabels[visibility]}
                  </option>
                ))}
              </select>
            </AdminField>
          </SettingsRow>
        </SettingsSection>

        <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-[#fafaf9]/95 px-4 py-3 backdrop-blur sm:-mx-7 sm:px-7">
          <button type="submit" className={adminPrimaryButtonClassName}>
            저장하기
          </button>
        </div>
      </form>
    </section>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-line bg-white">
      <div className="border-b border-line px-4 py-3">
        <h3 className="text-sm font-bold tracking-normal text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-zinc-600">{description}</p>
      </div>
      <div className="divide-y divide-line">{children}</div>
    </section>
  );
}

function SettingsRow({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3">{children}</div>;
}

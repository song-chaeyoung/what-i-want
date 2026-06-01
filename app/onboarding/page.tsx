import { redirect } from "next/navigation";
import { requireUser } from "@/src/lib/auth/require-user";
import { getOnboardingState } from "@/src/lib/onboarding/repository";
import { BirthdayPicker } from "./birthday-picker";

type OnboardingPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  display_name_required: "표시 이름을 입력해주세요.",
  invalid_birthday: "생일은 YYYY-MM-DD 형식의 실제 날짜로 선택해주세요.",
  duplicate_slug: "공개 주소를 만드는 중 문제가 발생했습니다. 다시 시도해주세요.",
  already_completed: "이미 온보딩이 완료되었습니다.",
};

export default async function OnboardingPage({
  searchParams,
}: OnboardingPageProps) {
  const user = await requireUser();
  const state = await getOnboardingState(user.id);

  if (state.isComplete) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] : null;

  return (
    <main className="min-h-dvh bg-[#fafaf9] px-5 py-12 text-ink">
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-2xl flex-col justify-center">
        <section className="rounded-md border border-line bg-white p-6 shadow-pub">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-teal">온보딩</p>
            <h1 className="text-3xl font-semibold tracking-normal text-ink">
              기본 위시리스트 만들기
            </h1>
            <p className="text-sm leading-6 text-zinc-600">
              처음 공유할 공개 위시리스트의 기본 정보를 정합니다.
            </p>
          </div>

          {errorMessage ? (
            <p className="mt-5 rounded-md border border-[#f97316] bg-[#fff7ed] px-4 py-3 text-sm font-medium text-[#9a3412]">
              {errorMessage}
            </p>
          ) : null}

          <form
            action="/api/onboarding"
            method="post"
            className="mt-8 space-y-5"
          >
            <Field label="표시 이름" htmlFor="displayName">
              <input
                id="displayName"
                name="displayName"
                type="text"
                defaultValue={user.name ?? ""}
                required
                className={inputClassName}
              />
            </Field>

            <Field label="생일" htmlFor="birthday">
              <BirthdayPicker id="birthday" name="birthday" />
            </Field>

            <Field label="소개" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={4}
                className={textareaClassName}
              />
            </Field>

            <button
              type="submit"
              className="h-12 w-full rounded-md border border-ink bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
            >
              위시리스트 만들기
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-md border border-line px-3 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

const textareaClassName =
  "w-full resize-none rounded-md border border-line px-3 py-2 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-zinc-400";

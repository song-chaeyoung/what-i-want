import Link from "next/link";
import { DrizzleAdminMessagesRepository } from "@/src/lib/admin-messages/repository";
import { listAdminMessages } from "@/src/lib/admin-messages/service";
import { requireUser } from "@/src/lib/auth/require-user";
import { DrizzleWishRepository } from "@/src/lib/wishes/repository";
import { listWishes } from "@/src/lib/wishes/service";

const errorMessages: Record<string, string> = {
  wishlist_not_found: "먼저 온보딩을 완료해주세요.",
};

export default async function AdminPage() {
  const user = await requireUser();
  const [wishesResult, messagesResult] = await Promise.all([
    listWishes(user.id, new DrizzleWishRepository()),
    listAdminMessages(user.id, new DrizzleAdminMessagesRepository()),
  ]);

  if (!wishesResult.ok) {
    return (
      <section>
        <div className="rounded-md border border-orange/40 bg-[#fff7ed] p-5 text-sm font-medium text-[#9a3412]">
          {errorMessages[wishesResult.error]}
        </div>
      </section>
    );
  }

  if (!messagesResult.ok) {
    return (
      <section>
        <div className="rounded-md border border-orange/40 bg-[#fff7ed] p-5 text-sm font-medium text-[#9a3412]">
          {errorMessages[messagesResult.error]}
        </div>
      </section>
    );
  }

  const totalFundedAmount = wishesResult.items.reduce(
    (sum, item) => sum + item.fundedAmount,
    0,
  );

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-md border border-line bg-white p-5 shadow-pub">
          <p className="text-sm font-semibold text-teal">기본 목록</p>
          <h2 className="mt-2 text-xl font-extrabold tracking-normal text-ink">
            공개 위시리스트
          </h2>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            선물을 등록하고 상태를 관리한 뒤 공개 링크로 공유합니다.
          </p>
          <Link
            href="/admin/wishes"
            className="mt-5 inline-flex h-10 items-center rounded-md border border-ink bg-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-black"
          >
            선물 관리하기
          </Link>
        </div>
        <SummaryCard
          label="선물"
          value={`${wishesResult.items.length}개`}
          detail={`모인 금액 ${formatCurrency(totalFundedAmount)}`}
        />
        <SummaryCard
          label="메시지"
          value={`${messagesResult.messages.length}개`}
          detail="최근 마음은 메시지함에서 확인합니다."
        />
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-md border border-line bg-white p-5 shadow-pub">
      <p className="text-sm font-semibold text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold text-ink">{value}</p>
      <p className="mt-3 text-sm leading-6 text-zinc-600">{detail}</p>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

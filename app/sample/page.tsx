import type { Metadata } from "next";
import { PublicWishlistView } from "@/components/public-wishlist-view";
import type {
  PublicWishItemView,
  PublicWishlistRecord,
} from "@/src/lib/public-wishlist/types";
import { PUBLIC_THEME_IDS, type PublicThemeId } from "@/src/lib/wishlist/theme";

export const metadata: Metadata = {
  title: "샘플 위시리스트 | 뭐갖고싶어",
  description: "뭐갖고싶어로 만들 수 있는 공개 위시리스트 샘플 페이지입니다.",
};

const sampleDate = new Date("2026-01-01T00:00:00+09:00");

const sampleWishlist: PublicWishlistRecord = {
  id: "sample",
  slug: "sample",
  title: "민지님의 위시리스트",
  themeId: "pixel_y2k",
};

const sampleItems: PublicWishItemView[] = [
  {
    id: "sample-headphones",
    wishlistId: "sample",
    title: "무선 헤드폰",
    description: "출퇴근길에 늘 쓰고 다닐 헤드폰이에요. 색은 크림색이 좋아요!",
    targetAmount: 45000,
    fundedAmount: 32400,
    productUrl: null,
    imageUrl: null,
    status: "open",
    sortOrder: 0,
    createdAt: sampleDate,
    updatedAt: sampleDate,
    progress: 72,
    isComplete: false,
  },
  {
    id: "sample-cake",
    wishlistId: "sample",
    title: "생일 케이크",
    description: "올해는 딸기 생크림 케이크로 함께 축하해주세요.",
    targetAmount: 28000,
    fundedAmount: 10640,
    productUrl: null,
    imageUrl: null,
    status: "open",
    sortOrder: 1,
    createdAt: sampleDate,
    updatedAt: sampleDate,
    progress: 38,
    isComplete: false,
  },
];

type SampleWishlistPageProps = {
  searchParams: Promise<{
    theme?: string;
  }>;
};

export default async function SampleWishlistPage({
  searchParams,
}: SampleWishlistPageProps) {
  const { theme } = await searchParams;
  const themeId = getThemeId(theme);

  return (
    <PublicWishlistView
      wishlist={{ ...sampleWishlist, themeId }}
      items={sampleItems}
      account={null}
      demo
    />
  );
}

function getThemeId(value: string | undefined): PublicThemeId {
  return (
    PUBLIC_THEME_IDS.find((themeId) => themeId === value) ??
    sampleWishlist.themeId
  );
}

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DrizzlePublicWishlistRepository } from "@/src/lib/public-wishlist/repository";
import { getPublicWishlist } from "@/src/lib/public-wishlist/service";

export const alt = "공개 생일 위시리스트";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const OG_FONT_FAMILY = "Noto Sans CJK KR";

type OpenGraphImageProps = {
  params: Promise<{ slug: string }>;
};

export default async function Image({ params }: OpenGraphImageProps) {
  const { slug } = await params;
  const fontData = await readOgFont();
  const result = await getPublicWishlist(
    slug,
    new DrizzlePublicWishlistRepository(),
  );

  if (!result.ok) {
    return renderWishlistImage({
      title: "위시리스트를 찾을 수 없어요",
      itemCount: 0,
      totalFundedAmount: 0,
      topItems: ["공개 링크를 다시 확인해주세요"],
      fontData,
    });
  }

  const visibleItems = result.items.slice(0, 3);
  const totalFundedAmount = result.items.reduce(
    (sum, item) => sum + item.fundedAmount,
    0,
  );

  return renderWishlistImage({
    title: result.wishlist.title,
    itemCount: result.items.length,
    totalFundedAmount,
    topItems:
      visibleItems.length > 0
        ? visibleItems.map((item) => item.title)
        : ["아직 공개된 선물이 없어요"],
    fontData,
  });
}

function renderWishlistImage({
  title,
  itemCount,
  totalFundedAmount,
  topItems,
  fontData,
}: {
  title: string;
  itemCount: number;
  totalFundedAmount: number;
  topItems: string[];
  fontData: ArrayBuffer;
}) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#fff1f2",
          color: "#171717",
          padding: 58,
          fontFamily: OG_FONT_FAMILY,
        }}
      >
        <section
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            gap: 30,
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              border: "5px solid #171717",
              background: "#fffdf7",
              boxShadow: "14px 14px 0 #111827",
              padding: 46,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  color: "#0f766e",
                  fontSize: 30,
                  lineHeight: 1.2,
                  fontWeight: 900,
                }}
              >
                생일 위시리스트 보러가기
              </div>
              <div
                style={{
                  display: "flex",
                  color: "#4c1d95",
                  fontSize: 58,
                  lineHeight: 1.15,
                  fontWeight: 900,
                  letterSpacing: 0,
                }}
              >
                {title}
              </div>
            </div>

            <div style={{ display: "flex", gap: 14 }}>
              <div style={statStyle}>
                <span style={statLabelStyle}>선물</span>
                <span style={statValueStyle}>{itemCount}개</span>
              </div>
              <div style={statStyle}>
                <span style={statLabelStyle}>모인 마음</span>
                <span style={statValueStyle}>
                  {formatCurrency(totalFundedAmount)}
                </span>
              </div>
            </div>
          </div>

          <aside
            style={{
              width: 350,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <div
              style={{
                display: "flex",
                border: "4px solid #171717",
                background: "#fef3c7",
                boxShadow: "9px 9px 0 #111827",
                padding: "18px 20px",
                color: "#4c1d95",
                fontSize: 26,
                lineHeight: 1.15,
                fontWeight: 900,
              }}
            >
              갖고 싶은 것들
            </div>
            {topItems.map((item, index) => (
              <div
                key={`${item}-${index}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  border: "4px solid #171717",
                  background: index === 0 ? "#ccfbf1" : "#fffdf7",
                  padding: 20,
                  minHeight: 106,
                  boxShadow: "9px 9px 0 #111827",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    color: "#f97316",
                    fontSize: 18,
                    lineHeight: 1,
                    fontWeight: 900,
                    marginBottom: 10,
                  }}
                >
                  #{index + 1}
                </div>
                <div
                  style={{
                    display: "flex",
                    color: "#171717",
                    fontSize: 25,
                    lineHeight: 1.28,
                    fontWeight: 800,
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </aside>
        </section>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: OG_FONT_FAMILY,
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

async function readOgFont(): Promise<ArrayBuffer> {
  const font = await readFile(
    join(process.cwd(), "app/fonts/NotoSansCJKkr-Bold.otf"),
  );

  return font.buffer.slice(
    font.byteOffset,
    font.byteOffset + font.byteLength,
  ) as ArrayBuffer;
}

function formatCurrency(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

const statStyle = {
  display: "flex",
  flexDirection: "column" as const,
  border: "3px solid #171717",
  background: "#fef3c7",
  padding: "14px 18px",
  minWidth: 132,
};

const statLabelStyle = {
  display: "flex",
  color: "#4c1d95",
  fontSize: 18,
  lineHeight: 1,
  fontWeight: 900,
  marginBottom: 9,
};

const statValueStyle = {
  display: "flex",
  color: "#171717",
  fontSize: 30,
  lineHeight: 1,
  fontWeight: 900,
};

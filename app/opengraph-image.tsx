import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "뭐갖고싶어 - 생일 위시리스트 공유 서비스";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const OG_FONT_FAMILY = "MonaS12";
const OG_FALLBACK_FONT_FAMILY = "Noto Sans CJK KR";

export default async function Image() {
  const [brandFont, fallbackFont] = await Promise.all([
    readFontFile("app/fonts/MonaS12-Bold.ttf"),
    readFontFile("app/fonts/NotoSansCJKkr-Bold.otf"),
  ]);

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
            position: "relative",
            overflow: "hidden",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "5px solid #171717",
            background: "#fffdf7",
            boxShadow: "14px 14px 0 #111827",
            padding: 56,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -36,
              top: -36,
              width: 150,
              height: 150,
              border: "4px solid #171717",
              background: "#ccfbf1",
              transform: "rotate(12deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 150,
              bottom: -44,
              width: 116,
              height: 116,
              border: "4px solid #171717",
              background: "#fef3c7",
              transform: "rotate(-8deg)",
            }}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                border: "3px solid #171717",
                background: "#ccfbf1",
                boxShadow: "6px 6px 0 #111827",
                padding: "10px 16px",
                color: "#0f766e",
                fontSize: 30,
                lineHeight: 1,
                fontWeight: 800,
              }}
            >
              생일 축하해. 뭐 갖고 싶어?
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {["받고 싶은 선물을", "링크 하나로 모아", "공유해요."].map(
                (line) => (
                  <div
                    key={line}
                    style={{
                      display: "flex",
                      color: "#4c1d95",
                      fontSize: 70,
                      lineHeight: 1.14,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {line}
                  </div>
                ),
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              alignItems: "center",
            }}
          >
            <div style={pillStyle}>선물 후보 정리</div>
            <div style={pillStyle}>친구는 로그인 없이</div>
            <div style={pillStyle}>마음과 메시지 받기</div>
          </div>
        </section>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: OG_FONT_FAMILY,
          data: brandFont,
          style: "normal",
          weight: 700,
        },
        {
          name: OG_FALLBACK_FONT_FAMILY,
          data: fallbackFont,
          style: "normal",
          weight: 700,
        },
      ],
    },
  );
}

async function readFontFile(relativePath: string): Promise<ArrayBuffer> {
  const font = await readFile(join(process.cwd(), relativePath));

  return font.buffer.slice(
    font.byteOffset,
    font.byteOffset + font.byteLength,
  ) as ArrayBuffer;
}

const pillStyle = {
  display: "flex",
  border: "3px solid #171717",
  background: "#ffe4e6",
  padding: "12px 18px",
  color: "#171717",
  fontSize: 24,
  lineHeight: 1,
  fontWeight: 800,
};

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "뭐갖고싶어 - 생일 위시리스트 공유 서비스";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

const OG_FONT_FAMILY = "Noto Sans CJK KR";

export default async function Image() {
  const fontData = await readOgFont();

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
        <div
          style={{
            position: "absolute",
            right: 54,
            top: 48,
            width: 180,
            height: 180,
            border: "4px solid #171717",
            background: "#ccfbf1",
            transform: "rotate(3deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 128,
            bottom: 54,
            width: 140,
            height: 140,
            border: "4px solid #171717",
            background: "#fef3c7",
            transform: "rotate(-6deg)",
          }}
        />
        <section
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            border: "5px solid #171717",
            background: "#fffdf7",
            boxShadow: "14px 14px 0 #111827",
            padding: 52,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            <div
              style={{
                display: "flex",
                color: "#0f766e",
                fontSize: 34,
                lineHeight: 1.2,
                fontWeight: 800,
              }}
            >
              생일 축하해. 뭐 갖고 싶어?
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: 780,
                color: "#4c1d95",
                fontSize: 76,
                lineHeight: 1.08,
                fontWeight: 900,
                letterSpacing: 0,
              }}
            >
              받고 싶은 선물을 링크 하나로 모아 공유해요.
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

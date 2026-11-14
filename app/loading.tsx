import { BRAND_NAME } from "@/src/lib/design/copy";

export default function RootLoading() {
  return (
    <main className="pixel-dot-bg grid min-h-dvh place-items-center px-5">
      <div className="flex flex-col items-center gap-2">
        <p className="font-pixel animate-pulse text-2xl text-purple">
          {BRAND_NAME}
        </p>
        <p className="text-sm font-semibold text-ink-faint">
          불러오는 중이에요…
        </p>
      </div>
    </main>
  );
}

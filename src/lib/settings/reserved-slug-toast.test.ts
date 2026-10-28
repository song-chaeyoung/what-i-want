import { beforeEach, describe, expect, test, vi } from "vitest";
import { AdminToastEvents } from "@/app/admin/admin-toast-events";

const { route, errorToast, replace } = vi.hoisted(() => ({
  route: { query: "" },
  errorToast: vi.fn(),
  replace: vi.fn(),
}));

vi.mock("react", () => ({
  useEffect: (effect: () => void) => effect(),
  useRef: () => ({ current: null }),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/settings",
  useSearchParams: () => new URLSearchParams(route.query),
  useRouter: () => ({ replace }),
}));
vi.mock("sonner", () => ({ toast: { error: errorToast } }));

beforeEach(() => vi.clearAllMocks());

describe("reserved wishlist slug feedback", () => {
  test.each([
    [
      "reserved_slug",
      "sample은 서비스 전용 주소입니다. 다른 공개 주소를 입력해주세요.",
    ],
    ["invalid_slug", "요청을 처리하지 못했어요."],
    ["__proto__", "요청을 처리하지 못했어요."],
  ])("shows the expected feedback for %s", (error, message) => {
    route.query = `error=${error}&guide=1`;

    AdminToastEvents();

    expect(errorToast).toHaveBeenCalledExactlyOnceWith(message, undefined);
    expect(replace).toHaveBeenCalledExactlyOnceWith(
      "/admin/settings?guide=1",
      { scroll: false },
    );
  });
});

import { describe, expect, test, vi } from "vitest";
import { unlinkKakaoUser } from "./unlink";

const kakaoUserId = "123456789";

function requestOf(fetchImpl: ReturnType<typeof vi.fn>): {
  url: string;
  method: string;
  headers: Headers;
  body: string;
} {
  const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
  const headers = new Headers(init.headers);

  return {
    url,
    method: init.method ?? "GET",
    headers,
    body: String(init.body),
  };
}

describe("unlinkKakaoUser", () => {
  test("posts the admin key and the Kakao user id", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ id: Number(kakaoUserId) }), { status: 200 }),
    );

    await expect(
      unlinkKakaoUser(kakaoUserId, {
        fetch: fetchImpl,
        adminKey: "test-admin-key",
      }),
    ).resolves.toEqual({ ok: true });

    const request = requestOf(fetchImpl);
    expect(request.url).toBe("https://kapi.kakao.com/v1/user/unlink");
    expect(request.method).toBe("POST");
    expect(request.headers.get("Authorization")).toBe("KakaoAK test-admin-key");
    expect(request.headers.get("Content-Type")).toBe(
      "application/x-www-form-urlencoded;charset=utf-8",
    );
    expect(request.body).toBe(
      "target_id_type=user_id&target_id=123456789",
    );
  });

  test("treats error code -101 as already unlinked", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({ msg: "NotRegisteredUserException", code: -101 }),
        { status: 400 },
      ),
    );

    await expect(
      unlinkKakaoUser(kakaoUserId, {
        fetch: fetchImpl,
        adminKey: "test-admin-key",
      }),
    ).resolves.toEqual({ ok: true });
  });

  test.each([
    { status: 401, body: JSON.stringify({ code: -401 }) },
    { status: 400, body: JSON.stringify({ code: -1 }) },
    { status: 500, body: "" },
  ])("fails on HTTP $status", async ({ status, body }) => {
    const fetchImpl = vi.fn(async () => new Response(body, { status }));

    await expect(
      unlinkKakaoUser(kakaoUserId, {
        fetch: fetchImpl,
        adminKey: "test-admin-key",
      }),
    ).resolves.toEqual({ ok: false, reason: "http_error" });
  });

  test("fails when the network rejects the request", async () => {
    const fetchImpl = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });

    await expect(
      unlinkKakaoUser(kakaoUserId, {
        fetch: fetchImpl,
        adminKey: "test-admin-key",
      }),
    ).resolves.toEqual({ ok: false, reason: "network" });
  });

  test("fails when the request times out", async () => {
    const fetchImpl: typeof fetch = (_input, init) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
        });
      });

    await expect(
      unlinkKakaoUser(kakaoUserId, {
        fetch: fetchImpl,
        adminKey: "test-admin-key",
        timeoutMs: 10,
      }),
    ).resolves.toEqual({ ok: false, reason: "timeout" });
  });

  test("does not call Kakao when the admin key is missing", async () => {
    const previous = process.env.KAKAO_ADMIN_KEY;
    delete process.env.KAKAO_ADMIN_KEY;
    const fetchImpl = vi.fn();

    try {
      await expect(
        unlinkKakaoUser(kakaoUserId, { fetch: fetchImpl }),
      ).resolves.toEqual({ ok: false, reason: "missing_admin_key" });
      await expect(
        unlinkKakaoUser(kakaoUserId, { fetch: fetchImpl, adminKey: "  " }),
      ).resolves.toEqual({ ok: false, reason: "missing_admin_key" });
      expect(fetchImpl).not.toHaveBeenCalled();
    } finally {
      if (previous === undefined) {
        delete process.env.KAKAO_ADMIN_KEY;
      } else {
        process.env.KAKAO_ADMIN_KEY = previous;
      }
    }
  });
});

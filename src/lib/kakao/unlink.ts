const KAKAO_UNLINK_URL = "https://kapi.kakao.com/v1/user/unlink";
const DEFAULT_TIMEOUT_MS = 5_000;
const NOT_LINKED_CODE = -101;

export type KakaoUnlinkFailureReason =
  | "missing_admin_key"
  | "timeout"
  | "network"
  | "http_error";

export type KakaoUnlinkResult =
  | { ok: true }
  | { ok: false; reason: KakaoUnlinkFailureReason };

export type KakaoUnlinkDependencies = {
  fetch?: typeof fetch;
  adminKey?: string;
  timeoutMs?: number;
};

export async function unlinkKakaoUser(
  kakaoUserId: string,
  dependencies: KakaoUnlinkDependencies = {},
): Promise<KakaoUnlinkResult> {
  const adminKey = (dependencies.adminKey ?? process.env.KAKAO_ADMIN_KEY ?? "").trim();
  const fetchImpl = dependencies.fetch ?? fetch;

  if (!adminKey) {
    return { ok: false, reason: "missing_admin_key" };
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    dependencies.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const response = await fetchImpl(KAKAO_UNLINK_URL, {
      method: "POST",
      headers: {
        Authorization: `KakaoAK ${adminKey}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      body: new URLSearchParams({
        target_id_type: "user_id",
        target_id: kakaoUserId,
      }).toString(),
      signal: controller.signal,
    });
    const body = await response.text();

    if (response.ok) {
      return { ok: true };
    }

    if (response.status === 400 && isNotLinked(body)) {
      return { ok: true };
    }

    return { ok: false, reason: "http_error" };
  } catch (error) {
    if (isTimeout(error)) {
      return { ok: false, reason: "timeout" };
    }

    return { ok: false, reason: "network" };
  } finally {
    clearTimeout(timeout);
  }
}

function isNotLinked(body: string): boolean {
  try {
    const parsed: unknown = JSON.parse(body);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      "code" in parsed &&
      parsed.code === NOT_LINKED_CODE
    );
  } catch {
    return false;
  }
}

function isTimeout(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

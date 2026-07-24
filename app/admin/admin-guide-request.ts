export type AdminGuideCompletionStatus = "ok" | "unauthorized" | "error";

type AdminGuideFetcher = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

export async function requestAdminGuideCompletion(
  fetcher: AdminGuideFetcher = fetch,
): Promise<AdminGuideCompletionStatus> {
  try {
    const response = await fetcher(
      "/api/admin/onboarding-guide/complete",
      { method: "POST" },
    );

    if (response.status === 401) {
      return "unauthorized";
    }

    return response.ok ? "ok" : "error";
  } catch {
    return "error";
  }
}

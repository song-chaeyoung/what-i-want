"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { readPublicParticipationFormInput } from "@/src/lib/public-participation/form-input";
import {
  checkPublicParticipationRateLimit,
  readPublicParticipationRateLimitVisitor,
} from "@/src/lib/public-participation/rate-limit";
import { DrizzlePublicParticipationRepository } from "@/src/lib/public-participation/repository";
import { submitPublicParticipation } from "@/src/lib/public-participation/service";

export async function submitParticipationAction(
  slug: string,
  formData: FormData,
): Promise<void> {
  const headerList = await headers();
  const rateLimit = checkPublicParticipationRateLimit({
    slug,
    ...readPublicParticipationRateLimitVisitor(headerList),
  });

  if (!rateLimit.allowed) {
    redirect(`/wishlist/${slug}?error=rate_limited`);
  }

  let result: Awaited<ReturnType<typeof submitPublicParticipation>>;
  try {
    result = await submitPublicParticipation(
      {
        slug,
        ...readPublicParticipationFormInput(formData),
      },
      new DrizzlePublicParticipationRepository(),
    );
  } catch (error) {
    console.error(error);
    redirect(`/wishlist/${slug}?error=unexpected`);
  }

  if (!result.ok) {
    redirect(`/wishlist/${slug}?error=${result.error}`);
  }

  redirect(`/wishlist/${slug}?sent=${result.kind}`);
}

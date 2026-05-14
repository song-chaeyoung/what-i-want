"use server";

import { signIn } from "@/auth";

export async function signInWithGoogle(): Promise<void> {
  await signIn("google", {
    redirectTo: "/auth/after-login",
  });
}

export async function signInWithKakao(): Promise<void> {
  await signIn("kakao", {
    redirectTo: "/auth/after-login",
  });
}

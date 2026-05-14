import { redirect } from "next/navigation";
import { auth } from "@/auth";

export type AuthenticatedUser = {
  id: string;
  name: string | null | undefined;
  email: string | null | undefined;
  image: string | null | undefined;
};

export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };
}

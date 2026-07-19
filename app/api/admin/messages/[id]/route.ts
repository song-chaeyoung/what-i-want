import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { DrizzleAdminMessagesRepository } from "@/src/lib/admin-messages/repository";
import {
  hideAdminMessage,
  unhideAdminMessage,
} from "@/src/lib/admin-messages/service";
import { revalidatePublicWishlistByOwner } from "@/src/lib/public-wishlist/cache";

type MessageRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: MessageRouteContext,
): Promise<Response> {
  const requestUrl = new URL(request.url);

  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", requestUrl));
    }

    const { id } = await context.params;
    const formData = await request.formData();
    const unhide = formData.get("intent") === "unhide";

    const repository = new DrizzleAdminMessagesRepository();
    const result = unhide
      ? await unhideAdminMessage(session.user.id, id, repository)
      : await hideAdminMessage(session.user.id, id, repository);

    if (!result.ok) {
      return NextResponse.redirect(
        new URL("/admin/messages?error=1", requestUrl),
      );
    }

    await revalidatePublicWishlistByOwner(session.user.id);

    return NextResponse.redirect(
      new URL(
        unhide
          ? "/admin/messages?messageRestored=1"
          : "/admin/messages?messageHidden=1",
        requestUrl,
      ),
    );
  } catch (error) {
    console.error(error);
    return NextResponse.redirect(
      new URL("/admin/messages?error=1", requestUrl),
    );
  }
}

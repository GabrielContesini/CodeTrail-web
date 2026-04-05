import { NextResponse } from "next/server";
import {
  ensureCustomerSupportConversation,
  listCustomerSupportConversations,
  SupportChatDataError,
} from "@/utils/server/support-chat";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || 50);
    const inbox = await listCustomerSupportConversations(limit);

    return NextResponse.json(inbox);
  } catch (error) {
    return buildSupportErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json().catch(() => ({}))) as {
      origin?: string | null;
      pageUrl?: string | null;
      subject?: string | null;
    };

    const thread = await ensureCustomerSupportConversation(payload);

    return NextResponse.json(thread);
  } catch (error) {
    return buildSupportErrorResponse(error);
  }
}

function buildSupportErrorResponse(error: unknown) {
  const resolved =
    error instanceof SupportChatDataError
      ? error
      : new SupportChatDataError(
          error instanceof Error ? error.message : "Falha no chat de suporte.",
          500,
        );

  return NextResponse.json(
    {
      error: resolved.message,
      storageReady: resolved.storageReady,
    },
    { status: resolved.status },
  );
}

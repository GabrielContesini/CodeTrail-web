import { NextResponse } from "next/server";
import {
  sendCustomerSupportMessage,
  SupportChatDataError,
} from "@/utils/server/support-chat";
import {
  sanitizeSupportMessageBody,
  validateSupportMessageBody,
} from "@/utils/support/chat-shared";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await context.params;
    const payload = (await request.json().catch(() => ({}))) as {
      body?: string | null;
      clientMessageId?: string | null;
    };

    const body = sanitizeSupportMessageBody(payload.body);
    const validation = validateSupportMessageBody(body);

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          storageReady: true,
        },
        { status: 400 },
      );
    }

    const result = await sendCustomerSupportMessage(
      conversationId,
      body,
      payload.clientMessageId ?? null,
    );

    return NextResponse.json(result);
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

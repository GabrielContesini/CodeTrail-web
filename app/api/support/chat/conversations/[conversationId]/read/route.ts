import { NextResponse } from "next/server";
import {
  markCustomerSupportThreadRead,
  SupportChatDataError,
} from "@/utils/server/support-chat";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(
  _request: Request,
  context: { params: Promise<{ conversationId: string }> },
) {
  try {
    const { conversationId } = await context.params;
    const conversation = await markCustomerSupportThreadRead(conversationId);

    return NextResponse.json({ conversation });
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

import { NextRequest } from "next/server";
import {
  jsonApiResponse,
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "@/utils/server/api-response";
import {
  createPortalOnServer,
  getBillingServiceErrorDetails,
  parseReturnUrl,
} from "@/utils/server/billing-service";
import { createRequestId, logServerEvent } from "@/utils/server/observability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: NextRequest) {
  const requestId = createRequestId();

  try {
    const body = await request.json().catch(() => ({}));
    const portal = await createPortalOnServer(
      request,
      {
        returnUrl: parseReturnUrl(body.returnUrl),
      },
      requestId,
    );

    return jsonApiResponse(portal, {
      requestId,
      cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
    });
  } catch (error) {
    const { message, status } = getBillingServiceErrorDetails(error);
    logServerEvent({
      area: "billing",
      event: "internal_portal_failed",
      level: "error",
      requestId,
      metadata: {
        message,
      },
    });

    return jsonApiResponse(
      { error: message },
      {
        status,
        requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
      },
    );
  }
}

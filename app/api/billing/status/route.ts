import { NextRequest } from "next/server";
import {
  jsonApiResponse,
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "@/utils/server/api-response";
import {
  getBillingServiceErrorDetails,
  getBillingSnapshotOnServer,
  parseBillingPlanCode,
  syncBillingOnServer,
} from "@/utils/server/billing-service";
import { createRequestId, logServerEvent } from "@/utils/server/observability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const requestId = createRequestId();

  try {
    const plan = parseBillingPlanCode(request.nextUrl.searchParams.get("plan"));
    const shouldSync = request.nextUrl.searchParams.get("sync") === "1";

    // Stripe webhook persistence remains the source of truth. This endpoint only
    // exposes the current snapshot and can ask the provider for a guarded sync
    // when the UI needs a short-lived reconciliation after checkout.
    const result = shouldSync
      ? await syncBillingOnServer(request, requestId)
      : { snapshot: await getBillingSnapshotOnServer(request, requestId) };

    return jsonApiResponse(
      {
        ...result,
        requestedPlan: plan,
      },
      {
        requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
      },
    );
  } catch (error) {
    const { message, status } = getBillingServiceErrorDetails(error);
    logServerEvent({
      area: "billing",
      event: "internal_status_failed",
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

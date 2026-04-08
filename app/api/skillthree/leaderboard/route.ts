import {
  jsonApiResponse,
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "@/utils/server/api-response";
import {
  createRouteLogContext,
  getRouteErrorDetails,
  logRouteCompletion,
  logRouteStart,
} from "@/utils/server/observability";
import { loadSkillThreeLeaderboard } from "@/utils/server/skillthree-leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const routeContext = createRouteLogContext({
    area: "skillthree",
    route: "/api/skillthree/leaderboard",
    method: "GET",
  });

  logRouteStart(routeContext);

  try {
    const payload = await loadSkillThreeLeaderboard();

    logRouteCompletion(routeContext, {
      status: 200,
      metadata: {
        source: payload.source,
      },
    });

    return jsonApiResponse(payload, {
      status: 200,
      requestId: routeContext.requestId,
      cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
    });
  } catch (error) {
    const details = getRouteErrorDetails(
      error,
      "Nao foi possivel carregar o ranking do SkillThree.",
    );

    logRouteCompletion(routeContext, {
      status: details.status,
      errorCategory: details.category,
      metadata: {
        message: details.message,
      },
    });

    return jsonApiResponse(
      {
        error: details.message,
        errorCategory: details.category,
      },
      {
        status: details.status,
        requestId: routeContext.requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
      },
    );
  }
}

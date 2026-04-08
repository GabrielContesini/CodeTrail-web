import {
  jsonApiResponse,
  PRIVATE_NO_STORE_CACHE_CONTROL,
} from "@/utils/server/api-response";
import { collectApiHealthReport } from "@/utils/server/health";
import {
  createRouteLogContext,
  getRouteDurationMs,
  getRouteErrorDetails,
  logRouteCompletion,
  logRouteStart,
} from "@/utils/server/observability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const routeContext = createRouteLogContext({
    area: "health",
    route: "/api/health",
    method: "GET",
  });

  logRouteStart(routeContext);

  try {
    const report = await collectApiHealthReport();
    const durationMs = getRouteDurationMs(routeContext);
    const httpStatus = report.status === "error" ? 503 : 200;

    logRouteCompletion(routeContext, {
      status: httpStatus,
      level: report.status === "degraded" ? "warn" : undefined,
      metadata: {
        healthStatus: report.status,
        skippedChecks: report.summary.skipped,
        degradedChecks: report.summary.degraded,
        errorChecks: report.summary.error,
      },
    });

    return jsonApiResponse(
      {
        ...report,
        requestId: routeContext.requestId,
        durationMs,
      },
      {
        status: httpStatus,
        requestId: routeContext.requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
      },
    );
  } catch (error) {
    const details = getRouteErrorDetails(
      error,
      "Não foi possível consolidar o health das APIs.",
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
        status: "error",
        timestamp: new Date().toISOString(),
        requestId: routeContext.requestId,
        durationMs: getRouteDurationMs(routeContext),
        summary: {
          ok: 0,
          skipped: 0,
          degraded: 0,
          error: 1,
        },
        checks: {
          app: {
            status: "error",
            critical: true,
            summary: details.message,
            errorCategory: details.category,
          },
        },
      },
      {
        status: details.status,
        requestId: routeContext.requestId,
        cacheControl: PRIVATE_NO_STORE_CACHE_CONTROL,
      },
    );
  }
}

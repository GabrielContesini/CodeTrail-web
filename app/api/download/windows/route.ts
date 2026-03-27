import {
  PUBLIC_DOWNLOAD_CACHE_CONTROL,
  redirectApiResponse,
} from "@/utils/server/api-response";
import { resolveWindowsDownloadTarget } from "@/utils/server/github-release";
import { createRequestId, logServerEvent } from "@/utils/server/observability";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const requestId = createRequestId();
  const resolution = await resolveWindowsDownloadTarget(requestId);

  logServerEvent({
    area: "download",
    event: "windows_redirect_resolved",
    requestId,
    metadata: {
      source: resolution.source,
      reason: resolution.reason,
    },
  });

  return redirectApiResponse(resolution.location, {
    requestId,
    cacheControl: PUBLIC_DOWNLOAD_CACHE_CONTROL,
    headers: {
      "x-codetrail-download-source": resolution.source,
    },
  });
}

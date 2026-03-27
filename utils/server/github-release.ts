import { logServerEvent } from "@/utils/server/observability";

const releasesEndpoint =
  "https://api.github.com/repos/GabrielContesini/CodeTrailWindows/releases/latest";
export const releasePage =
  "https://github.com/GabrielContesini/CodeTrailWindows/releases/latest";

type GitHubAsset = {
  name: string;
  browser_download_url: string;
};

type GitHubRelease = {
  assets?: GitHubAsset[];
};

export interface DownloadResolution {
  location: string;
  source: "github-asset" | "release-page" | "stale-cache";
  reason: string;
}

interface CachedDownloadResolution extends DownloadResolution {
  expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
let cachedResolution: CachedDownloadResolution | null = null;

export async function resolveWindowsDownloadTarget(
  requestId?: string,
  fetchImpl: typeof fetch = fetch,
): Promise<DownloadResolution> {
  const now = Date.now();
  if (cachedResolution && cachedResolution.expiresAt > now) {
    return {
      location: cachedResolution.location,
      source: cachedResolution.source,
      reason: "cache_hit",
    };
  }

  try {
    const response = await fetchImpl(releasesEndpoint, {
      headers: buildGitHubHeaders(),
      cache: "no-store",
    });

    if (!response.ok) {
      return resolveFailure({
        requestId,
        reason: `github_status_${response.status}`,
      });
    }

    const release = (await response.json()) as GitHubRelease;
    const asset = release.assets?.find(
      ({ name }) =>
        name.toLowerCase().endsWith(".exe") &&
        name.toLowerCase().includes("setup"),
    );

    if (!asset) {
      return resolveFailure({
        requestId,
        reason: "missing_setup_asset",
      });
    }

    const nextResolution: CachedDownloadResolution = {
      location: asset.browser_download_url,
      source: "github-asset",
      reason: "github_latest_release",
      expiresAt: now + CACHE_TTL_MS,
    };
    cachedResolution = nextResolution;
    return {
      location: nextResolution.location,
      source: nextResolution.source,
      reason: nextResolution.reason,
    };
  } catch (error) {
    return resolveFailure({
      requestId,
      reason: error instanceof Error ? error.message : "github_fetch_failed",
    });
  }
}

export function resetWindowsDownloadCache() {
  cachedResolution = null;
}

function resolveFailure({
  requestId,
  reason,
}: {
  requestId?: string;
  reason: string;
}): DownloadResolution {
  if (cachedResolution) {
    logServerEvent({
      area: "download",
      event: "github_release_lookup_stale_cache",
      level: "warn",
      requestId,
      metadata: {
        reason,
      },
    });

    return {
      location: cachedResolution.location,
      source: "stale-cache",
      reason,
    };
  }

  logServerEvent({
    area: "download",
    event: "github_release_lookup_fallback",
    level: "warn",
    requestId,
    metadata: {
      reason,
    },
  });

  return {
    location: releasePage,
    source: "release-page",
    reason,
  };
}

function buildGitHubHeaders() {
  const headers = new Headers({
    Accept: "application/vnd.github+json",
    "User-Agent": "CodeTrailWeb/1.0 (+https://codetrail.site)",
  });

  const token = process.env.GITHUB_TOKEN ?? process.env.GITHUB_RELEASES_TOKEN;
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
}

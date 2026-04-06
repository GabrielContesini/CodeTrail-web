import type { ProjectRow } from "@/utils/workspace/types";

export interface GitHubRepositoryReference {
  owner: string;
  repo: string;
  slug: string;
  normalizedUrl: string;
}

const GITHUB_HOSTS = new Set(["github.com", "www.github.com"]);
const GITHUB_SEGMENT_PATTERN = /^[A-Za-z0-9._-]+$/;

export function parseGitHubRepositoryUrl(
  value: string | null | undefined,
): GitHubRepositoryReference | null {
  const normalizedInput = value?.trim();
  if (!normalizedInput) {
    return null;
  }

  const candidate = normalizedInput.startsWith("http://") || normalizedInput.startsWith("https://")
    ? normalizedInput
    : `https://${normalizedInput}`;

  let url: URL;

  try {
    url = new URL(candidate);
  } catch {
    return null;
  }

  if (!GITHUB_HOSTS.has(url.hostname.toLowerCase())) {
    return null;
  }

  const segments = url.pathname
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

  if (segments.length < 2) {
    return null;
  }

  const owner = segments[0];
  const repo = segments[1].replace(/\.git$/i, "");

  if (
    !owner ||
    !repo ||
    !GITHUB_SEGMENT_PATTERN.test(owner) ||
    !GITHUB_SEGMENT_PATTERN.test(repo)
  ) {
    return null;
  }

  return {
    owner,
    repo,
    slug: `${owner}/${repo}`,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
}

export function resolveProjectOptionalField<TKey extends keyof Pick<
  ProjectRow,
  "track_id" | "repository_url" | "documentation_url" | "video_url"
>>(
  payload: Partial<ProjectRow>,
  existing: ProjectRow | undefined,
  key: TKey,
): ProjectRow[TKey] {
  if (Object.prototype.hasOwnProperty.call(payload, key)) {
    return (payload[key] ?? null) as ProjectRow[TKey];
  }

  return (existing?.[key] ?? null) as ProjectRow[TKey];
}

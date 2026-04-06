import { describe, expect, it } from "vitest";
import type { ProjectRow } from "@/utils/workspace/types";
import {
  parseGitHubRepositoryUrl,
  resolveProjectOptionalField,
} from "@/utils/workspace/projects";

const existingProject: ProjectRow = {
  id: "project_1",
  user_id: "user_1",
  track_id: "track_1",
  title: "Projeto Base",
  scope: "Entrega prática",
  description: "Projeto para testes",
  repository_url: "https://github.com/codetrail/base-repo",
  documentation_url: "https://docs.codetrail.site/base",
  video_url: "https://video.codetrail.site/base",
  status: "active",
  progress_percent: 55,
  created_at: "2026-04-01T10:00:00.000Z",
  updated_at: "2026-04-01T10:00:00.000Z",
};

describe("workspace project helpers", () => {
  it("normalizes GitHub repository urls to the canonical repo root", () => {
    expect(
      parseGitHubRepositoryUrl(
        "https://github.com/openai/codex/tree/main/examples?tab=readme",
      ),
    ).toEqual({
      owner: "openai",
      repo: "codex",
      slug: "openai/codex",
      normalizedUrl: "https://github.com/openai/codex",
    });
  });

  it("accepts GitHub urls without protocol and strips .git suffix", () => {
    expect(parseGitHubRepositoryUrl("github.com/octocat/Hello-World.git")).toEqual({
      owner: "octocat",
      repo: "Hello-World",
      slug: "octocat/Hello-World",
      normalizedUrl: "https://github.com/octocat/Hello-World",
    });
  });

  it("rejects non-GitHub urls", () => {
    expect(
      parseGitHubRepositoryUrl("https://gitlab.com/openai/codex"),
    ).toBeNull();
  });

  it("allows clearing a saved repository url with explicit null", () => {
    expect(
      resolveProjectOptionalField(
        {
          repository_url: null,
        },
        existingProject,
        "repository_url",
      ),
    ).toBeNull();
  });

  it("keeps the existing repository url when the payload omits the field", () => {
    expect(
      resolveProjectOptionalField(
        {
          title: "Projeto editado",
        },
        existingProject,
        "repository_url",
      ),
    ).toBe("https://github.com/codetrail/base-repo");
  });
});

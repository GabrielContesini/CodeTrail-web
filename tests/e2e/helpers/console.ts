import { expect, type Page } from "@playwright/test";

interface ClientErrorEntry {
  source: "console" | "pageerror";
  text: string;
}

export function attachClientErrorCollector(
  page: Page,
  options: {
    ignorePatterns?: readonly RegExp[];
  } = {},
) {
  const entries: ClientErrorEntry[] = [];
  const ignorePatterns = options.ignorePatterns ?? [];

  const shouldIgnore = (text: string) =>
    ignorePatterns.some((pattern) => pattern.test(text));

  page.on("console", (message) => {
    if (!["error", "assert"].includes(message.type())) {
      return;
    }

    const text = message.text().trim();
    if (!text || shouldIgnore(text)) {
      return;
    }

    entries.push({
      source: "console",
      text,
    });
  });

  page.on("pageerror", (error) => {
    const text = error.message.trim();
    if (!text || shouldIgnore(text)) {
      return;
    }

    entries.push({
      source: "pageerror",
      text,
    });
  });

  return {
    entries,
    expectNoCriticalErrors() {
      const normalized = entries.map((entry) => `[${entry.source}] ${entry.text}`);
      expect(
        normalized,
        normalized.length
          ? `Erros críticos detectados no cliente:\n${normalized.join("\n")}`
          : "Nenhum erro crítico detectado no cliente.",
      ).toEqual([]);
    },
  };
}

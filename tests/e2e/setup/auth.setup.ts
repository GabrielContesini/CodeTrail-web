import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { test } from "@playwright/test";
import { loginThroughUi } from "../helpers/auth";
import { AUTH_STORAGE_STATE, hasAuthCredentials } from "../helpers/constants";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test("persist authenticated storage state", async ({ page }) => {
  mkdirSync(dirname(AUTH_STORAGE_STATE), { recursive: true });
  await loginThroughUi(page);
  await page.context().storageState({ path: AUTH_STORAGE_STATE });
});

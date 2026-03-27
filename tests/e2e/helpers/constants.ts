import path from "node:path";

export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3002";
export const E2E_USER_EMAIL = process.env.E2E_USER_EMAIL ?? "";
export const E2E_USER_PASSWORD = process.env.E2E_USER_PASSWORD ?? "";
export const AUTH_STORAGE_STATE = path.join(process.cwd(), "playwright", ".auth", "user.json");

export function hasAuthCredentials() {
  return Boolean(E2E_USER_EMAIL && E2E_USER_PASSWORD);
}

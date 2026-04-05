export interface PrivacyPreferences {
  analytics: boolean;
  updatedAt: string;
}

export const PRIVACY_PREFERENCES_OPEN_EVENT =
  "codetrail:open-privacy-preferences";

const STORAGE_KEY = "codetrail-privacy-preferences";
const COOKIE_NAME = "codetrail_analytics_consent";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function isBrowser() {
  return typeof window !== "undefined";
}

function parseBoolean(value: string | null) {
  if (value === "granted") return true;
  if (value === "denied") return false;
  return null;
}

export function readPrivacyPreferences(): PrivacyPreferences | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<PrivacyPreferences> | null;
      if (parsed && typeof parsed.analytics === "boolean") {
        return {
          analytics: parsed.analytics,
          updatedAt:
            typeof parsed.updatedAt === "string"
              ? parsed.updatedAt
              : new Date().toISOString(),
        };
      }
    }
  } catch {
    // Ignore invalid local storage payloads and fall back to cookie state.
  }

  const cookieValue = readCookieValue(COOKIE_NAME);
  const analytics = parseBoolean(cookieValue);
  if (analytics === null) {
    return null;
  }

  return {
    analytics,
    updatedAt: new Date().toISOString(),
  };
}

export function savePrivacyPreferences(preferences: PrivacyPreferences) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie =
    `${COOKIE_NAME}=${preferences.analytics ? "granted" : "denied"}` +
    `; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
}

export function createPrivacyPreferences(analytics: boolean): PrivacyPreferences {
  return {
    analytics,
    updatedAt: new Date().toISOString(),
  };
}

function readCookieValue(name: string) {
  if (!isBrowser()) {
    return null;
  }

  const prefix = `${name}=`;
  for (const item of document.cookie.split(";")) {
    const normalized = item.trim();
    if (normalized.startsWith(prefix)) {
      return normalized.slice(prefix.length);
    }
  }

  return null;
}

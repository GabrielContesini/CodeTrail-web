import { expect, test } from "@playwright/test";
import { hasAuthCredentials } from "../helpers/constants";
import { dismissOnboardingIfVisible } from "../helpers/dismiss-onboarding";

test.skip(!hasAuthCredentials(), "E2E_USER_EMAIL e E2E_USER_PASSWORD nao configurados.");

test.describe("authenticated tracks timeline", () => {
  test("opens the trail timeline when clicking a track card", async ({ page }) => {
    await page.goto("/workspace/tracks");
    await dismissOnboardingIfVisible(page);

    const firstTrackCard = page.locator('[data-testid^="track-card-"]').first();
    await expect(firstTrackCard).toBeVisible();

    const trackId = await firstTrackCard.getAttribute("data-testid");
    await firstTrackCard.click();

    await expect(page).toHaveURL(/\/workspace\/tracks\/.+$/);
    await expect(page.getByText("Timeline de estudo").first()).toBeVisible();
    await expect(page.getByText("Timeline da trilha").first()).toBeVisible();

    if (trackId) {
      const normalizedTrackId = trackId.replace("track-card-", "");
      await expect(page).toHaveURL(new RegExp(`/workspace/tracks/${normalizedTrackId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
    }
  });
});

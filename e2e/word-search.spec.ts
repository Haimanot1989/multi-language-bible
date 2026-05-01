import { expect, test } from "@playwright/test";

test.describe("Word search", () => {
  test("shows full verse text with highlighted match and opens verse view", async ({ page }) => {
    await page.goto("/multi-language-bible/");

    await expect(page.getByRole("heading", { name: /multi-language bible/i })).toBeVisible();

    const queryInput = page.getByPlaceholder('e.g., "love", "faith", "hope"');
    await expect
      .poll(async () => {
        await page.getByRole("button", { name: "Search words" }).click();
        return queryInput.count();
      })
      .toBe(1);

    await expect(queryInput).toBeVisible();
    await queryInput.fill("beginning");

    // The language selector in word-search mode defaults to English.
    await page.locator('button[type="submit"]', { hasText: "Search Words" }).click();

    await expect(page.getByRole("heading", { name: "Search Results" })).toBeVisible();

    const firstResult = page.locator("button.group").first();
    await expect(firstResult).toBeVisible();

    // Ensure full verse text is present and not just a short token snippet.
    await expect(firstResult).toContainText("In the beginning God created");

    // Ensure matched query token is highlighted.
    await expect(firstResult.locator("mark").first()).toBeVisible();

    await firstResult.click();

    await expect(page.getByText("Visible languages")).toBeVisible();
  });
});


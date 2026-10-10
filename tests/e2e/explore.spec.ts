import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

async function onboard(page: import("@playwright/test").Page) {
  await signUp(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("spinbutton").first().fill("40");
  await page.getByRole("button", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const nums = page.getByRole("spinbutton");
  await nums.nth(0).fill("172");
  await nums.nth(1).fill("78");
  await nums.nth(2).fill("72");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Lightly active/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Vegetarian", exact: true }).click();
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Balanced weight loss/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "See my targets" }).click();
  await page.waitForURL("**/targets");
}

test("explore → start a guide program → My program → session", async ({ page }) => {
  await onboard(page);
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Trending guides" })).toBeVisible();
  await page.locator('a[href="/explore/tai-chi-guide"]').click();
  await page.waitForURL("**/explore/tai-chi-guide");
  await page.getByRole("button", { name: /Start this program/ }).click();
  await page.getByRole("button", { name: /Yes, start it today/ }).click();
  await page.waitForURL("**/home");
  await expect(page.getByRole("link", { name: /Start workout/ })).toBeVisible();
  await page.getByRole("link", { name: /Start workout/ }).click();
  await page.waitForURL("**/workouts/session/0");
  await expect(page.getByText(/Day 1 of 28/)).toBeVisible();

  // Me and its daily goals.
  await page.goto("/me/goals");
  await page.getByLabel(/Steps/).fill("9000");
  await page.getByRole("button", { name: /Save goals/ }).click();
  await page.waitForURL("**/me");
  await expect(page.getByText("of 9,000")).toBeVisible();
});

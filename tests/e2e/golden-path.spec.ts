import { expect, test } from "@playwright/test";
import { signUp } from "./helpers";

test("onboard → targets → plan → swap → cook → log", async ({ page }) => {
  await signUp(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("spinbutton").first().fill("34");
  await page.getByRole("button", { name: "Female" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const nums = page.getByRole("spinbutton");
  await nums.nth(0).fill("160");
  await nums.nth(1).fill("72");
  await nums.nth(2).fill("62");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Lightly active/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  // Health check: diabetes on medication must disable keto.
  await page.getByRole("button", { name: /Diabetes, on insulin/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Vegetarian", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByRole("button", { name: /Ketogenic/ })).toBeDisabled();
  await page.getByRole("button", { name: /Balanced weight loss/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "See my targets" }).click();
  await page.waitForURL("**/targets");
  await expect(page.getByText("28.1")).toBeVisible();
  await expect(page.getByText(/talk to a healthcare professional/i)).toBeVisible();

  await page.getByRole("link", { name: "Build my meal plan" }).click();
  await page.getByRole("button", { name: /Generate plan/ }).click();
  await page.waitForURL(/\/planner$/);
  await expect(page.getByRole("heading", { name: "Breakfast" })).toBeVisible();

  await page.getByRole("button", { name: /Swap meal/ }).first().click();
  const option = page.getByRole("dialog").getByRole("button").filter({ hasText: "kcal" }).first();
  await option.click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("link", { name: /Start cooking/ }).first().click();
  await page.waitForURL(/\/cook\//);
  for (let i = 0; i < 20; i++) {
    const finish = page.getByRole("button", { name: /^Finish/ });
    if (await finish.isVisible()) {
      await finish.click();
      break;
    }
    await page.getByRole("button", { name: /^Next/ }).click();
  }
  await page.getByRole("button", { name: /Log 1 serving/ }).click();
  await expect(page.getByRole("button", { name: /Logged to today/ })).toBeVisible();
  await page.goto("/home");
  await expect(page.getByText(/kcal left|kcal over/)).toBeVisible();
});

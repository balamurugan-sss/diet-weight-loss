import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

async function onboard(page: Page) {
  await signUp(page);
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("spinbutton").first().fill("30");
  await page.getByRole("button", { name: "Male", exact: true }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  const nums = page.getByRole("spinbutton");
  await nums.nth(0).fill("175");
  await nums.nth(1).fill("80");
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

test("workout setup → hub → swap → session with logged sets → completed day", async ({ page }) => {
  await onboard(page);

  await page.goto("/workouts");
  await page.getByRole("link", { name: /Set up workouts/ }).click();
  await page.waitForURL("**/workouts/setup");
  // The goal is pre-filled from the food plan.
  await expect(page.getByRole("button", { name: /Weight loss/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /^Gym/ }).click();
  await page.getByRole("button", { name: /^Intermediate/ }).click();
  await page.getByRole("radio", { name: /4/ }).click();
  const build = page.getByRole("button", { name: /Build my 4-week plan/ });
  await expect(build).toBeDisabled();
  await page.getByRole("checkbox").check();
  await build.click();
  await page.waitForURL(/\/workouts$/);
  await expect(page.getByText(/Day 1 of 28/).first()).toBeVisible();
  await expect(page.getByText("0 of 16 workouts")).toBeVisible();

  // Preview and swap the first exercise for this day only.
  await page.getByRole("link", { name: "See exercises" }).click();
  await page.waitForURL("**/workouts/day/0");
  await page.getByRole("button", { name: "Swap" }).first().click();
  await page.getByRole("dialog").getByRole("button").filter({ hasText: /press/i }).first().click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.getByRole("link", { name: /Start workout/ }).click();
  await page.waitForURL("**/workouts/session/0");
  // Skip the warm-up to the first exercise and log its sets with a weight.
  while (!(await page.getByRole("button", { name: "Mark set 1 done" }).isVisible())) await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByLabel("Set 1 kg").fill("30");
  await page.getByRole("button", { name: "Mark set 1 done" }).click();
  await expect(page.getByRole("timer")).toBeVisible();
  await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Mark set 2 done" }).click();

  await page.getByRole("button", { name: "Finish workout" }).last().click();
  await expect(page.getByRole("heading", { name: "Workout complete!" })).toBeVisible();
  await expect(page.getByText(/added to today's food budget/)).toBeVisible();

  await page.getByRole("link", { name: "Back to workouts" }).click();
  await expect(page.getByText("Done for today")).toBeVisible();
  await expect(page.getByText("1 of 16 workouts")).toBeVisible();
});

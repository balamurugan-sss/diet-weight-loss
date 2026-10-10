import type { Page } from "@playwright/test";

/** Creates a fresh account through the sign-up form and lands on onboarding. */
export async function signUp(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /get started/i }).click();
  await page.waitForURL("**/signup");
  await page.getByLabel("First name").fill("Arun");
  await page.getByLabel("Email").fill(`e2e-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`);
  await page.getByLabel("Password", { exact: true }).fill("correct-horse-42");
  await page.getByLabel("Confirm password").fill("correct-horse-42");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/onboarding");
}

import "server-only";
import { cookies } from "next/headers";

export const THEME_COOKIE = "thali_theme";
export type Theme = "dark" | "light";

/** Dark is the default look; the ivory light theme is an opt-in setting. */
export async function getTheme(): Promise<Theme> {
  return (await cookies()).get(THEME_COOKIE)?.value === "light" ? "light" : "dark";
}

import "server-only";
import { notFound } from "next/navigation";
import { requireOnboarded } from "@/server/auth/dal";

/** Admins are signed-in accounts whose email is listed in ADMIN_EMAILS (comma-separated). */
export function isAdminEmail(email: string | null | undefined) {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/** For admin pages and actions; everyone else gets a 404 so the area isn't discoverable. */
export async function requireAdmin() {
  const current = await requireOnboarded();
  if (!isAdminEmail(current.user.email)) notFound();
  return current;
}

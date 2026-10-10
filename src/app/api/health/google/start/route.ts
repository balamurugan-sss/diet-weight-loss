import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/dal";
import { config } from "@/server/config";
import { authorizationUrl, googleHealthConfigured, STATE_COOKIE } from "@/server/providers/googleHealth";

/** Starts the Google Health (Fitbit / Pixel Watch) OAuth consent. */
export async function GET() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.redirect(new URL("/", config.appUrl));
  if (!googleHealthConfigured()) return NextResponse.redirect(new URL("/health?google=not_configured", config.appUrl));
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(STATE_COOKIE, `${state}.${current.user.id}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/health/google",
    maxAge: 600,
  });
  return NextResponse.redirect(authorizationUrl(state));
}

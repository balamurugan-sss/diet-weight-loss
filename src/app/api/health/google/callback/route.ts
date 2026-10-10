import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/server/auth/dal";
import { config } from "@/server/config";
import { STATE_COOKIE } from "@/server/providers/googleHealth";
import { connectGoogle, syncGoogle } from "@/server/services/health";
import { bodyWeight } from "@/server/services/workouts";

const back = (status: string) => NextResponse.redirect(new URL(`/me/sync/google?google=${status}`, config.appUrl));

/** OAuth redirect target: checks state, stores encrypted tokens, runs a first sync. */
export async function GET(req: NextRequest) {
  const current = await getCurrentUser();
  if (!current?.profile) return NextResponse.redirect(new URL("/", config.appUrl));
  const jar = await cookies();
  const saved = jar.get(STATE_COOKIE)?.value ?? "";
  jar.delete({ name: STATE_COOKIE, path: "/api/health/google" });
  const params = req.nextUrl.searchParams;
  if (params.get("error")) return back("denied");
  const [state, userId] = saved.split(".");
  const got = params.get("state") ?? "";
  const ok = state && got.length === state.length && timingSafeEqual(Buffer.from(got), Buffer.from(state)) && userId === current.user.id;
  const code = params.get("code");
  if (!ok || !code) return back("state_mismatch");
  try {
    await connectGoogle(current.user.id, code);
  } catch {
    return back("failed");
  }
  try {
    await syncGoogle(current.user.id, await bodyWeight(current.user.id, current.profile));
  } catch {
    return back("connected_sync_failed");
  }
  // Connected: next, the daily goals the Me tab tracks.
  return NextResponse.redirect(new URL("/me/goals?connected=google", config.appUrl));
}

import "server-only";
import { getCurrentUser } from "@/server/auth/dal";

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

/** Rejects cross-site POSTs to JSON route handlers (server actions do this automatically). */
export function sameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

export async function apiUser(req: Request) {
  if (!sameOrigin(req)) return { error: json({ error: "forbidden" }, 403) } as const;
  const current = await getCurrentUser();
  if (!current?.profile?.onboardingCompletedAt) return { error: json({ error: "unauthorized" }, 401) } as const;
  return { current } as const;
}

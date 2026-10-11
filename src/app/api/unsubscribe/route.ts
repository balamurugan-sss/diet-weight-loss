import { unsubscribeAction } from "@/server/actions/notifications";

/** One-click unsubscribe (RFC 8058): mail apps POST here from the List-Unsubscribe header. */
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  const res = await unsubscribeAction(token);
  return new Response(null, { status: res.ok ? 200 : 400 });
}

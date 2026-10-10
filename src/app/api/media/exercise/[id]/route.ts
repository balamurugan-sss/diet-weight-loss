import { isAdminEmail } from "@/server/admin";
import { getCurrentUser } from "@/server/auth/dal";
import { clipBlob } from "@/server/services/exerciseMedia";

/**
 * Exercise demo clips. Approved clips are public catalogue content; clips
 * awaiting review are only visible to admins. Supports Range requests, which
 * Safari requires for <video>.
 */
export async function GET(req: Request, ctx: RouteContext<"/api/media/exercise/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const row = await clipBlob(id);
  if (!row?.data || !row.mime) return new Response("Not found", { status: 404 });
  if (row.status !== "approved") {
    const current = await getCurrentUser();
    if (!isAdminEmail(current?.user.email)) return new Response("Not found", { status: 404 });
  }
  const data = new Uint8Array(row.data);
  const headers: Record<string, string> = {
    "Content-Type": row.mime,
    "Accept-Ranges": "bytes",
    // Approval can be withdrawn, so cache for a day rather than forever.
    "Cache-Control": row.status === "approved" ? "public, max-age=86400" : "private, no-store",
    "X-Content-Type-Options": "nosniff",
  };
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
    if (start > end || start >= data.length) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${data.length}` } });
    return new Response(data.slice(start, end + 1), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${data.length}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(data, { headers: { ...headers, "Content-Length": String(data.length) } });
}

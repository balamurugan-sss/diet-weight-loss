import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

export async function GET(_req: Request, ctx: RouteContext<"/api/media/audio/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9]{64}$/.test(id)) return new Response("Not found", { status: 404 });
  const [row] = await db.select({ data: schema.audioAssets.data, mime: schema.audioAssets.mime }).from(schema.audioAssets).where(eq(schema.audioAssets.id, id)).limit(1);
  if (!row) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.mime, "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}

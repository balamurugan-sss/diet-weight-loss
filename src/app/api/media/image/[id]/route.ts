import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";

// Asset ids are random and content never changes for an id, so responses are
// cacheable forever. Images are shared catalogue content, not user data.
export async function GET(_req: Request, ctx: RouteContext<"/api/media/image/[id]">) {
  const { id } = await ctx.params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const [row] = await db
    .select({ data: schema.imageAssets.data, mime: schema.imageAssets.mime, status: schema.imageAssets.status })
    .from(schema.imageAssets)
    .where(eq(schema.imageAssets.id, id))
    .limit(1);
  if (!row || row.status === "rejected") return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(row.data), {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

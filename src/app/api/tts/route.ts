import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { apiUser, json } from "@/server/api";
import { config, ProviderError } from "@/server/config";
import { db, schema } from "@/server/db/client";
import { cloudVoiceFor, synthesize } from "@/server/providers/tts";
import { rateLimit } from "@/server/rateLimit";
import { stepNarrations } from "@/server/services/narration";
import { consume, limitFor, refund } from "@/server/services/usage";

export const maxDuration = 60;

const Body = z.object({ recipeId: z.string().max(80), stepIndex: z.number().int().min(0).max(30), lang: z.enum(["en", "en-IN", "ta", "ml"]) });

/** Natural-voice narration of one validated step, cached by exact text. */
export async function POST(req: Request) {
  const auth = await apiUser(req);
  if ("error" in auth) return auth.error;
  const { user } = auth.current;
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: "bad_request" }, 400);
  const { recipeId, stepIndex, lang } = parsed.data;

  if (limitFor(user, "cloudTts") === 0) return json({ error: "premium" }, 402);
  const voice = cloudVoiceFor(lang);
  if (!config.tts.provider || !voice) return json({ error: "not_configured" }, 503);

  const narr = await stepNarrations(recipeId, lang);
  if (!narr) return json({ error: "no_translation" }, 409);
  const text = narr.steps[stepIndex];
  if (!text) return json({ error: "bad_request" }, 400);

  const id = createHash("sha256").update(`${config.tts.provider}|${voice}|${lang}|${text}`).digest("hex");
  const [cached] = await db.select({ id: schema.audioAssets.id }).from(schema.audioAssets).where(eq(schema.audioAssets.id, id)).limit(1);
  if (cached) return json({ url: `/api/media/audio/${id}`, cached: true });

  if (!(await rateLimit(`tts:${user.id}`, 30, 60))) return json({ error: "rate_limited" }, 429);
  if (!(await consume(user, "cloudTts", text.length))) return json({ error: "quota" }, 429);
  try {
    const audio = await synthesize(text, lang);
    await db
      .insert(schema.audioAssets)
      .values({ id, provider: audio.provider, voice: audio.voice, lang, mime: audio.mime, data: audio.data, chars: text.length })
      .onConflictDoNothing();
    return json({ url: `/api/media/audio/${id}`, cached: false });
  } catch (e) {
    await refund(user, "cloudTts", text.length);
    const status = e instanceof ProviderError ? e.status : 500;
    if (!(e instanceof ProviderError)) console.error(e);
    return json({ error: "failed" }, status);
  }
}

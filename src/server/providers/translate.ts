import "server-only";
import { config, ProviderError } from "@/server/config";
import { SPEECH_TAG } from "./tts";

/** Machine translation of validated English recipe text (Sarvam). */
export async function translateTexts(texts: string[], lang: string): Promise<string[]> {
  if (config.translate.provider !== "sarvam") throw new ProviderError("Translation is not configured", 503);
  const target = SPEECH_TAG[lang];
  if (!target || target === "en-IN") throw new ProviderError("Unsupported language", 422);
  const out: string[] = [];
  for (const input of texts) {
    const res = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: { "api-subscription-key": process.env.SARVAM_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({ input: input.slice(0, 1900), source_language_code: "en-IN", target_language_code: target, model: config.translate.model }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error("sarvam translate error", res.status, (await res.text().catch(() => "")).slice(0, 300));
      throw new ProviderError("Translation failed", res.status === 429 ? 429 : 502);
    }
    const json = (await res.json()) as { translated_text?: string };
    if (!json.translated_text) throw new ProviderError("Translation returned no text");
    out.push(json.translated_text);
  }
  return out;
}

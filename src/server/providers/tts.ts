import "server-only";
import { config, ProviderError } from "@/server/config";

export type SpeechResult = { data: Buffer; mime: string; provider: string; voice: string };

/** BCP-47 tags we send to providers for each narration language. */
export const SPEECH_TAG: Record<string, string> = { en: "en-IN", "en-IN": "en-IN", ta: "ta-IN", ml: "ml-IN", te: "te-IN", kn: "kn-IN", hi: "hi-IN" };

const GOOGLE_VOICES: Record<string, string> = {
  "en-IN": "en-IN-Wavenet-D",
  "ta-IN": "ta-IN-Wavenet-A",
  "ml-IN": "ml-IN-Wavenet-A",
  "te-IN": "te-IN-Standard-A",
  "kn-IN": "kn-IN-Wavenet-A",
  "hi-IN": "hi-IN-Wavenet-D",
};

export function cloudVoiceFor(lang: string): string | null {
  const tag = SPEECH_TAG[lang];
  if (!tag || !config.tts.provider) return null;
  if (config.tts.provider === "google") return GOOGLE_VOICES[tag] ?? null;
  return `${config.tts.sarvamModel}:${config.tts.sarvamSpeaker || "default"}:${tag}`;
}

function chunks(text: string, max: number) {
  if (text.length <= max) return [text];
  const out: string[] = [];
  let cur = "";
  for (const s of text.split(/(?<=[.!?।])\s+/)) {
    if ((cur + " " + s).length > max && cur) {
      out.push(cur);
      cur = s;
    } else cur = cur ? `${cur} ${s}` : s;
  }
  if (cur) out.push(cur);
  return out;
}

async function sarvam(text: string, tag: string): Promise<SpeechResult> {
  const parts = chunks(text, 2400);
  const bodies: Buffer[] = [];
  for (const part of parts) {
    const res = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: { "api-subscription-key": process.env.SARVAM_API_KEY!, "Content-Type": "application/json" },
      body: JSON.stringify({
        text: part,
        target_language_code: tag,
        model: config.tts.sarvamModel,
        ...(config.tts.sarvamSpeaker ? { speaker: config.tts.sarvamSpeaker } : {}),
        output_audio_codec: "mp3",
      }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) {
      console.error("sarvam tts error", res.status, (await res.text().catch(() => "")).slice(0, 300));
      throw new ProviderError("Voice generation failed", res.status === 429 ? 429 : 502);
    }
    const json = (await res.json()) as { audios?: string[] };
    if (!json.audios?.length) throw new ProviderError("Voice service returned no audio");
    bodies.push(...json.audios.map((a) => Buffer.from(a, "base64")));
  }
  // MP3 frames can be concatenated directly.
  return { data: Buffer.concat(bodies), mime: "audio/mpeg", provider: "sarvam", voice: cloudVoiceFor(tag.slice(0, 2))! };
}

async function google(text: string, tag: string): Promise<SpeechResult> {
  const name = GOOGLE_VOICES[tag];
  if (!name) throw new ProviderError("No natural voice for this language", 422);
  const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(process.env.GOOGLE_TTS_API_KEY!)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { text: text.slice(0, 4800) }, voice: { languageCode: tag, name }, audioConfig: { audioEncoding: "MP3" } }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    console.error("google tts error", res.status, (await res.text().catch(() => "")).slice(0, 300));
    throw new ProviderError("Voice generation failed", res.status === 429 ? 429 : 502);
  }
  const json = (await res.json()) as { audioContent?: string };
  if (!json.audioContent) throw new ProviderError("Voice service returned no audio");
  return { data: Buffer.from(json.audioContent, "base64"), mime: "audio/mpeg", provider: "google", voice: name };
}

export async function synthesize(text: string, lang: string): Promise<SpeechResult> {
  const tag = SPEECH_TAG[lang];
  if (!tag) throw new ProviderError("Unsupported narration language", 422);
  if (config.tts.provider === "sarvam") return sarvam(text, tag);
  if (config.tts.provider === "google") return google(text, tag);
  throw new ProviderError("Natural voices are not configured", 503);
}

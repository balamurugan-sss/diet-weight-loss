import "server-only";
import { config, ProviderError } from "@/server/config";

export type GeneratedImage = { data: Buffer; mime: string; provider: string; model: string };

/**
 * OpenAI GPT Image. With a reference image (the previous step) we use the
 * edits endpoint so cookware, surface and lighting carry over between steps.
 */
export async function generateImage(prompt: string, reference?: { data: Buffer; mime: string }): Promise<GeneratedImage> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new ProviderError("Image generation is not configured", 503);
  const common = { model: config.image.model, size: "1536x1024", quality: config.image.quality, output_format: "webp", output_compression: 82, n: 1 };
  let res: Response;
  if (reference) {
    const form = new FormData();
    for (const [k, v] of Object.entries(common)) form.append(k, String(v));
    form.append("prompt", prompt);
    form.append("image[]", new Blob([new Uint8Array(reference.data)], { type: reference.mime }), "reference.webp");
    res = await fetch("https://api.openai.com/v1/images/edits", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: form, signal: AbortSignal.timeout(120_000) });
  } else {
    res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ...common, prompt }),
      signal: AbortSignal.timeout(120_000),
    });
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("image provider error", res.status, detail.slice(0, 300));
    throw new ProviderError(res.status === 429 ? "Image service is busy — try again shortly" : "Image generation failed", res.status === 429 ? 429 : 502);
  }
  const json = (await res.json()) as { data?: { b64_json?: string }[] };
  const b64 = json.data?.[0]?.b64_json;
  if (!b64) throw new ProviderError("Image generation returned no image");
  return { data: Buffer.from(b64, "base64"), mime: "image/webp", provider: "openai", model: config.image.model };
}

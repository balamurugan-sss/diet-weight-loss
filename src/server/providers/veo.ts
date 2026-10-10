import "server-only";
import { parseOperation, startRequestBody, VEO, type OperationState } from "@/lib/media/veo";
import { ProviderError } from "@/server/config";

/** Google Veo 3.1 through the Gemini API. Needs GEMINI_API_KEY; model via VEO_MODEL. */
export const veoModel = () => process.env.VEO_MODEL || VEO.defaultModel;
export const veoConfigured = () => !!process.env.GEMINI_API_KEY;
/** Overridable for a proxy or a local mock; defaults to the Gemini API. */
const base = () => process.env.VEO_API_BASE || VEO.base;

function key() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new ProviderError("not_configured", 503);
  return k;
}

async function fail(res: Response, what: string): Promise<never> {
  const detail = await res.text().catch(() => "");
  console.error(`veo ${what} error`, res.status, detail.slice(0, 300));
  throw new ProviderError(res.status === 429 ? "busy" : res.status === 400 ? "rejected" : "failed", res.status === 429 ? 429 : 502);
}

/** Starts a generation; returns the operation name to poll. */
export async function startVideo(prompt: string): Promise<string> {
  const res = await fetch(`${base()}/models/${veoModel()}:predictLongRunning`, {
    method: "POST",
    headers: { "x-goog-api-key": key(), "Content-Type": "application/json" },
    body: JSON.stringify(startRequestBody(prompt)),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) await fail(res, "start");
  const body = (await res.json()) as { name?: string };
  if (!body.name) throw new ProviderError("failed");
  return body.name;
}

export async function checkVideo(operation: string): Promise<OperationState> {
  if (!/^[\w./-]+$/.test(operation)) throw new ProviderError("failed");
  const res = await fetch(`${base()}/${operation}`, { headers: { "x-goog-api-key": key() }, signal: AbortSignal.timeout(20_000) });
  if (!res.ok) await fail(res, "poll");
  return parseOperation(await res.json());
}

/** Downloads a finished clip (the file URI needs the API key and redirects to storage). */
export async function downloadVideo(uri: string): Promise<{ data: Buffer; mime: string }> {
  const url = new URL(uri);
  // Only follow file links on Google's API hosts (or the configured base), never arbitrary URLs.
  if (!url.hostname.endsWith("googleapis.com") && url.origin !== new URL(base()).origin) throw new ProviderError("failed");
  const res = await fetch(url, { headers: { "x-goog-api-key": key() }, redirect: "follow", signal: AbortSignal.timeout(120_000) });
  if (!res.ok) await fail(res, "download");
  const data = Buffer.from(await res.arrayBuffer());
  if (data.length > 30 * 1024 * 1024) throw new ProviderError("too_large");
  return { data, mime: res.headers.get("content-type")?.split(";")[0] || "video/mp4" };
}

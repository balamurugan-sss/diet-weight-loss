import "server-only";

/** Feature availability derived from server-side environment variables. Keys never leave the server. */
export const config = {
  image: {
    provider: process.env.OPENAI_API_KEY ? ("openai" as const) : null,
    model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-1",
    quality: (process.env.OPENAI_IMAGE_QUALITY || "medium") as "low" | "medium" | "high",
  },
  tts: {
    provider: process.env.SARVAM_API_KEY ? ("sarvam" as const) : process.env.GOOGLE_TTS_API_KEY ? ("google" as const) : null,
    sarvamModel: process.env.SARVAM_TTS_MODEL || "bulbul:v3",
    sarvamSpeaker: process.env.SARVAM_TTS_SPEAKER || "",
  },
  translate: {
    provider: process.env.SARVAM_API_KEY ? ("sarvam" as const) : null,
    model: process.env.SARVAM_TRANSLATE_MODEL || "sarvam-translate:v1",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || null,
    priceId: process.env.STRIPE_PRICE_ID || null,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || null,
  },
  allowDevPremium: process.env.NODE_ENV !== "production" || process.env.ALLOW_DEV_PREMIUM === "true",
  appUrl: process.env.APP_URL || "http://localhost:3000",
};

export class ProviderError extends Error {
  constructor(
    message: string,
    public status = 502,
  ) {
    super(message);
  }
}

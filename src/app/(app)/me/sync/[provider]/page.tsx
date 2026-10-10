import { ArrowRight, Heart, HeartPulse } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GoogleHealthCard } from "@/components/health/GoogleHealthCard";
import { HealthImport } from "@/components/health/HealthImport";
import { TopBar } from "@/components/ui/TopBar";
import { cn } from "@/lib/cn";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { googleHealthConfigured } from "@/server/providers/googleHealth";
import { getGoogleConnection } from "@/server/services/health";
import { APP_TIMEZONE } from "@/server/time";

export const metadata = { title: "Sync health data" };

/**
 * "Sync with Apple Health / Google Fit for better performance evaluation".
 *
 * Google: "Allow" starts the real Google sign-in (Google Health API — Fitbit,
 * Pixel Watch). Apple: a website can't read HealthKit (only an iPhone app
 * can), so "Allow" opens the import step for the Health app's export, read on
 * the phone with only daily totals saved. Either way, next come the daily goals.
 */
export default async function SyncPage({ params, searchParams }: PageProps<"/me/sync/[provider]">) {
  const { provider } = await params;
  if (provider !== "apple" && provider !== "google") notFound();
  const { user } = await requireOnboarded();
  const { t, lang } = await getI18n();
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const sp = await searchParams;
  const step = sp.step === "import" ? "import" : "intro";
  const status = typeof sp.google === "string" ? sp.google : null;
  const apple = provider === "apple";
  const conn = apple ? null : await getGoogleConnection(user.id);
  const configured = googleHealthConfigured();
  const name = apple ? t("sync.apple") : t("sync.google");
  const Icon = apple ? Heart : HeartPulse;
  const bar = "flex min-h-15 w-full items-center justify-between px-5 text-[18px] font-bold";

  return (
    <div className="mx-auto max-w-md">
      <TopBar title={t("sync.title", { name })} back="/me" backLabel={t("common.back")} />

      {step === "intro" && !conn ? (
        <div className="flex flex-col items-center text-center">
          <div className="relative my-8 grid size-56 place-items-center">
            <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(255_90_31/0.85)_0%,rgb(147_51_234/0.55)_45%,transparent_70%)] blur-2xl" aria-hidden />
            <span className="relative grid size-32 place-items-center rounded-[1.75rem] bg-white shadow-2xl">
              <Icon className={cn("size-16", apple ? "fill-[#ff2d55] text-[#ff2d55]" : "text-[#1a73e8]")} strokeWidth={apple ? 0 : 2.2} aria-hidden />
            </span>
          </div>
          <h2 className="text-[1.6rem] leading-tight font-extrabold">{t("sync.heading", { name })}</h2>
          <p className="mt-2 text-[16px] text-ink-2">{t("sync.body")}</p>
          {status && <p className="mt-4 w-full rounded-md bg-sand px-4 py-3 text-sm text-ink-2">{t(`health.google.${status}` as MessageKey)}</p>}
          <ul className="mt-5 w-full space-y-1.5 text-left text-sm text-muted">
            <li>• {t("sync.reads")}</li>
            <li>• {apple ? t("sync.appleHow") : configured ? t("sync.googleHow") : t("sync.googleNotConfigured")}</li>
          </ul>
          <div className="mt-8 w-full space-y-3">
            <Link href="/me/goals" className={cn(bar, "bg-sand-2 hover:bg-sand")}>
              {t("sync.skip")} <ArrowRight className="size-5" aria-hidden />
            </Link>
            {apple || !configured ? (
              <Link href={`/me/sync/${provider}?step=import`} className={cn(bar, "bg-lime text-on-accent hover:bg-lime-600")}>
                {t("sync.allow", { name })} <ArrowRight className="size-5" aria-hidden />
              </Link>
            ) : (
              // Plain link: the route redirects to Google's consent screen.
              <a href="/api/health/google/start" className={cn(bar, "bg-lime text-on-accent hover:bg-lime-600")}>
                {t("sync.allow", { name })} <ArrowRight className="size-5" aria-hidden />
              </a>
            )}
          </div>
        </div>
      ) : conn ? (
        <div className="space-y-4">
          <GoogleHealthCard
            configured={configured}
            connected
            lastSync={conn.lastSyncAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: APP_TIMEZONE }).format(conn.lastSyncAt) : null}
            lastError={conn.lastError ?? null}
            status={status}
          />
          <Link href="/me/goals" className={cn(bar, "bg-lime text-on-accent")}>
            {t("sync.goals")} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-[1.4rem] font-extrabold">{apple ? t("sync.importApple") : t("sync.importGoogle")}</h2>
          <p className="text-[15px] text-ink-2">{apple ? t("sync.importAppleBody") : t("sync.importGoogleBody")}</p>
          <div className="rounded-md bg-surface p-4">
            <HealthImport />
          </div>
          <Link href="/me/goals" className={cn(bar, "bg-lime text-on-accent")}>
            {t("sync.goals")} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}

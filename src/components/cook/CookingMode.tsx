"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Gauge,
  Languages,
  ListChecks,
  Mic,
  MicOff,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Sun,
  Thermometer,
  Timer as TimerIcon,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Tx, useI18n } from "@/components/i18n/I18nProvider";
import { IngredientList, localName, type IngredientLineView } from "@/components/recipes/IngredientList";
import { RecipeVisual } from "@/components/recipes/RecipeVisual";
import { Button, buttonClass } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { cn } from "@/lib/cn";
import { languageInfo } from "@/lib/i18n/languages";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { ingredientsNarration, narrationLang, timerDoneNarration } from "@/lib/i18n/narration";
import { displayQuantity, type UnitSystem } from "@/lib/recipes/measures";
import { finishCooking, saveCookingProgress } from "@/server/actions/cooking";
import { savePreferences } from "@/server/actions/profile";
import { chime, pickVoice, useTimer, useVoiceCommands, useVoices, useWakeLock } from "./hooks";

type ImageRef = { id: string; kind: "ai_illustration" | "verified_photo" } | null;
export type CookStep = { stepIndex: number; title: string; kind: string; timerSec: number | null; tempC: number | null; heat: string | null };
export type Narration = { status: string | null; texts: string[]; spoken: string[] };

export type CookingModeProps = {
  recipe: { id: string; slug: string; title: string; servings: number; palette: string[] };
  steps: CookStep[];
  narrations: Record<string, Narration>;
  lines: IngredientLineView[];
  stepImages: Record<number, ImageRef>;
  initial: { stepIndex: number; completed: number[]; servings: number };
  prefs: { lang: string; rate: number; units: UnitSystem; keepAwake: boolean; voiceCommands: boolean };
  planItemId: string | null;
  premium: boolean;
  configured: { images: boolean; tts: boolean; translate: boolean };
  quota: { stepImage: number; cloudTts: number };
};

const RATES = [0.75, 1, 1.25, 1.5];

export function CookingMode(p: CookingModeProps) {
  const { t } = useI18n();
  const router = useRouter();
  const total = p.steps.length;
  const [i, setI] = useState(Math.min(p.initial.stepIndex, total - 1));
  const [done, setDone] = useState<Set<number>>(new Set(p.initial.completed));
  const [servings, setServings] = useState(p.initial.servings);
  const [units, setUnits] = useState<UnitSystem>(p.prefs.units);
  const [finished, setFinished] = useState(false);
  const [logged, setLogged] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [rate, setRate] = useState(p.prefs.rate);
  const [voiceCmd, setVoiceCmd] = useState(p.prefs.voiceCommands);
  const [keepAwake, setKeepAwake] = useState(p.prefs.keepAwake);
  const [images, setImages] = useState(p.stepImages);
  const [imgState, setImgState] = useState<"idle" | "pending" | "error">("idle");
  const [imgError, setImgError] = useState<string | null>(null);
  const [checkedIngredients, setChecked] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  // ── Narration language: never switch silently ────────────────────────────
  const preferred = p.prefs.lang;
  const preferredContent = narrationLang(preferred);
  const hasPreferred = preferredContent === "en" || !!p.narrations[preferredContent];
  const [narrKey, setNarrKey] = useState<string | null>(hasPreferred ? preferredContent : null);
  const [speechTagOverride, setSpeechTagOverride] = useState<string | null>(null);
  const narration = p.narrations[narrKey ?? "en"];
  const speechTag = speechTagOverride ?? (narrKey === "en" ? languageInfo(preferred === "en-IN" ? "en-IN" : "en").speechTag : languageInfo(narrKey ?? "en").speechTag);
  const voices = useVoices();
  const deviceVoice = useMemo(() => pickVoice(voices, speechTag), [voices, speechTag]);
  const [audioMode, setAudioMode] = useState<"device" | "cloud">("device");
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cloudCache = useRef(new Map<string, string>());

  const wakeActive = useWakeLock(keepAwake && !finished);
  const step = p.steps[i];
  const stepText = narration?.texts[i] ?? p.narrations.en.texts[i];

  const stopAudio = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    audioRef.current?.pause();
  }, []);

  const speakDevice = useCallback(
    (text: string) => {
      if (!("speechSynthesis" in window) || !deviceVoice) return false;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.voice = deviceVoice;
      u.lang = deviceVoice.lang;
      u.rate = rate;
      window.speechSynthesis.speak(u);
      return true;
    },
    [deviceVoice, rate],
  );

  const speakStep = useCallback(
    async (index: number) => {
      if (!narrKey || !narration) return;
      setAudioError(null);
      stopAudio();
      if (audioMode === "cloud") {
        const key = `${narrKey}:${index}`;
        let url = cloudCache.current.get(key);
        if (!url) {
          const res = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipeId: p.recipe.id, stepIndex: index, lang: narrKey === "en" ? (preferred === "en-IN" ? "en-IN" : "en") : narrKey }),
          });
          const json = await res.json().catch(() => ({}));
          if (!res.ok || !json.url) {
            setAudioError(json.error === "premium" ? "cook.audio.cloudPremium" : "cook.audio.unavailable");
            setAudioMode("device");
            return;
          }
          url = json.url as string;
          cloudCache.current.set(key, url);
        }
        if (!audioRef.current) audioRef.current = new Audio();
        audioRef.current.src = url;
        audioRef.current.playbackRate = rate;
        await audioRef.current.play().catch(() => setAudioError("cook.audio.unavailable"));
        return;
      }
      if (!speakDevice(narration.spoken[index])) setAudioError("cook.audio.noVoice");
    },
    [narrKey, narration, audioMode, p.recipe.id, preferred, rate, speakDevice, stopAudio],
  );

  const timer = useTimer((sec) => {
    chime();
    if (narrKey && deviceVoice) speakDevice(timerDoneNarration(narrationLang(narrKey), sec));
  });

  const go = useCallback(
    (next: number) => {
      if (next >= total) {
        stopAudio();
        setFinished(true);
        return;
      }
      const n = Math.max(0, next);
      setI(n);
      setImgState("idle");
      if (playing) void speakStep(n);
      else stopAudio();
    },
    [total, playing, speakStep, stopAudio],
  );

  const onCommand = useCallback(
    (c: string) => {
      if (c === "next") {
        setDone((d) => new Set(d).add(i));
        go(i + 1);
      } else if (c === "back") go(i - 1);
      else if (c === "repeat") void speakStep(i);
      else if (c === "pause") {
        setPlaying(false);
        stopAudio();
      } else if (c === "timer" && step.timerSec) timer.start(step.timerSec);
    },
    [go, i, speakStep, stopAudio, step, timer],
  );
  const voice = useVoiceCommands(voiceCmd && !finished, speechTag, onCommand);

  // Persist progress so the user can resume later.
  useEffect(() => {
    const id = setTimeout(() => {
      void saveCookingProgress({ recipeId: p.recipe.id, stepIndex: i, completedSteps: [...done], servings, planItemId: p.planItemId });
    }, 700);
    return () => clearTimeout(id);
  }, [i, done, servings, p.recipe.id, p.planItemId]);

  useEffect(() => stopAudio, [stopAudio]);

  const savePref = (patch: Record<string, unknown>) => void savePreferences(patch);

  async function generate(regenerate: boolean) {
    setImgState("pending");
    setImgError(null);
    const res = await fetch("/api/images/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: p.recipe.id, stepIndex: step.stepIndex, regenerate }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.id) {
      setImages((m) => ({ ...m, [step.stepIndex]: { id: json.id, kind: json.kind } }));
      setImgState("idle");
    } else {
      setImgState("error");
      setImgError(json.error === "premium" ? "cook.imagePremium" : json.error === "not_configured" ? "cook.imageUnavailable" : json.error === "quota" ? "planner.limitReached" : "common.error");
    }
  }

  const labels = { ai: t("recipe.illustration"), photo: t("recipe.verifiedPhoto"), placeholder: t("recipe.illustrationPlaceholder") };
  const prefLangName = languageInfo(preferred).name;
  const mins = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (finished) {
    return (
      <div className="hero-gradient flex min-h-dvh flex-col items-center justify-center px-6 text-center text-white">
        <div className="mb-6 grid size-24 place-items-center rounded-full bg-lime text-forest-700">
          <ChefHat className="size-12" aria-hidden />
        </div>
        <h1 className="text-3xl font-semibold">{t("cook.done.title")}</h1>
        <p className="mt-2 max-w-sm text-white/80">{t("cook.done.body")}</p>
        <div className="mt-8 flex w-full max-w-sm flex-col gap-3">
          <Button
            variant="lime"
            size="xl"
            disabled={logged || pending}
            onClick={() =>
              start(async () => {
                const r = await finishCooking(p.recipe.id, p.planItemId, 1);
                if (r.ok) setLogged(true);
              })
            }
          >
            <Check className="size-5" aria-hidden /> {logged ? t("cook.done.logged") : t("cook.done.log", { n: 1 })}
          </Button>
          <Link href="/home" className={buttonClass("ghost", "lg", "text-white hover:bg-white/10")}>
            {t("nav.home")}
          </Link>
          <button type="button" className="text-sm text-white/70 underline-offset-4 hover:underline" onClick={() => (setFinished(false), setI(total - 1))}>
            {t("cook.prev")}
          </button>
        </div>
      </div>
    );
  }

  const image = images[step.stepIndex];

  return (
    <div className="flex h-dvh flex-col bg-ivory">
      <header className="flex items-center gap-2 border-b border-line bg-surface/90 px-3 py-2 backdrop-blur">
        <button type="button" onClick={() => (stopAudio(), router.push(`/recipes/${p.recipe.slug}`))} className="grid size-11 place-items-center rounded-full hover:bg-sand" aria-label={t("cook.exit")}>
          <X className="size-6" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{p.recipe.title}</p>
          <p className="text-xs text-muted">{t("cook.step", { n: i + 1, total })}</p>
        </div>
        <span className={cn("hidden items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold sm:inline-flex", wakeActive ? "bg-lime-100 text-forest-700" : "bg-sand text-muted")}>
          <Sun className="size-3.5" aria-hidden /> {wakeActive ? t("cook.wakeLock") : t("cook.wakeLockOff")}
        </span>
        <button type="button" onClick={() => setShowIngredients(true)} className="grid size-11 place-items-center rounded-full hover:bg-sand" aria-label={t("cook.ingredients")}>
          <ListChecks className="size-6" />
        </button>
        <button type="button" onClick={() => setShowSettings(true)} className="grid size-11 place-items-center rounded-full hover:bg-sand" aria-label={t("nav.settings")}>
          <Gauge className="size-6" />
        </button>
      </header>

      <div className="flex gap-1 px-3 pt-2" role="tablist" aria-label={t("recipe.method")}>
        {p.steps.map((s) => (
          <button
            key={s.stepIndex}
            type="button"
            role="tab"
            aria-selected={s.stepIndex === i}
            aria-label={t("cook.step", { n: s.stepIndex + 1, total })}
            onClick={() => go(s.stepIndex)}
            className={cn("h-2 flex-1 rounded-full transition-colors", s.stepIndex === i ? "bg-forest" : done.has(s.stepIndex) ? "bg-lime" : "bg-sand-2")}
          />
        ))}
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto grid max-w-5xl gap-4 p-3 sm:p-5 lg:grid-cols-[1.15fr_1fr] lg:items-start">
          <div className="relative">
            <RecipeVisual
              recipeId={p.recipe.id}
              palette={p.recipe.palette}
              image={image}
              stepIndex={step.stepIndex}
              alt={step.title}
              labels={labels}
              className="aspect-[4/3] rounded-[1.5rem] lg:aspect-[3/2]"
            />
            {imgState === "pending" && (
              <div className="absolute inset-0 grid place-items-center rounded-[1.5rem] bg-charcoal/40 text-white backdrop-blur-[1px]">
                <p className="flex items-center gap-2 font-semibold">
                  <RefreshCw className="size-5 animate-spin" aria-hidden /> {t("cook.imagePending")}
                </p>
              </div>
            )}
            <div className="absolute top-2 right-2">
              {p.premium && p.configured.images ? (
                <button
                  type="button"
                  disabled={imgState === "pending" || p.quota.stepImage <= 0}
                  onClick={() => void generate(!!image)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full bg-surface/90 px-3 text-xs font-semibold text-forest shadow backdrop-blur disabled:opacity-50"
                  title={t("common.remaining", { n: p.quota.stepImage })}
                >
                  {image ? <RefreshCw className="size-3.5" aria-hidden /> : <Sparkles className="size-3.5" aria-hidden />}
                  {image ? t("cook.regenerate") : t("recipe.generateImage")}
                </button>
              ) : (
                !image && <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-muted shadow">{t(p.premium ? "cook.imageUnavailable" : "cook.imagePremium")}</span>
              )}
            </div>
            {imgError && <p className="mt-2 text-sm text-terracotta">{t(imgError as MessageKey)}</p>}
          </div>

          <section aria-live="polite">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {step.timerSec && (
                <Badge tone="amber">
                  <TimerIcon className="size-3.5" aria-hidden /> {Math.round(step.timerSec / 60)} {t("common.min")}
                </Badge>
              )}
              {step.tempC && (
                <Badge tone="terracotta">
                  <Thermometer className="size-3.5" aria-hidden /> {step.tempC}°C
                </Badge>
              )}
              {step.heat && <Badge>{step.heat}</Badge>}
            </div>
            <h1 className="text-2xl leading-tight font-semibold sm:text-3xl">{step.title}</h1>
            <p className="mt-3 text-[1.25rem] leading-relaxed text-charcoal sm:text-[1.35rem]">
              <Tx>{stepText}</Tx>
            </p>
            {narrKey && narrKey !== "en" && narration?.status !== "reviewed" && (
              <p className="mt-2 text-xs text-muted">{t(narration?.status === "machine" ? "cook.audio.machine" : "cook.audio.draft")}</p>
            )}

            {!narrKey && (
              <div className="mt-4 rounded-2xl border border-amber/40 bg-amber-100 p-4 text-[#6d4704]">
                <p className="font-semibold">{t("cook.audio.noTranslation", { lang: prefLangName })}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setNarrKey("en")}>
                    {t("cook.audio.useEnglish")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => (setNarrKey("en"), setPlaying(false))}>
                    {t("cook.audio.readOnly")}
                  </Button>
                  {p.premium && p.configured.translate && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          const r = await fetch("/api/translate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ recipeId: p.recipe.id, lang: preferredContent }) });
                          if (r.ok) router.refresh();
                        })
                      }
                    >
                      <Languages className="size-4" aria-hidden /> {prefLangName}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {step.timerSec && (
              <div className="card mt-4 flex items-center gap-4 p-4">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-muted uppercase">{t("cook.timer")}</p>
                  <p className={cn("font-display text-4xl font-semibold tabular", timer.running && timer.remaining <= 10 && "text-terracotta")} role="timer" aria-live="off">
                    {mins(timer.running ? timer.remaining : step.timerSec)}
                  </p>
                </div>
                {timer.running ? (
                  <>
                    <Button variant="outline" onClick={() => timer.add(60)}>
                      +1 {t("common.min")}
                    </Button>
                    <Button variant="danger" onClick={timer.stop}>
                      {t("cook.stopTimer")}
                    </Button>
                  </>
                ) : (
                  <Button variant="primary" size="lg" onClick={() => timer.start(step.timerSec!)}>
                    <TimerIcon className="size-5" aria-hidden /> {t("cook.startTimer", { n: Math.round(step.timerSec / 60) })}
                  </Button>
                )}
              </div>
            )}

            {narrKey && (
              <div className="card mt-4 p-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={playing ? "secondary" : "primary"}
                    size="lg"
                    aria-pressed={playing}
                    onClick={() => {
                      if (playing) {
                        setPlaying(false);
                        stopAudio();
                      } else {
                        setPlaying(true);
                        void speakStep(i);
                      }
                    }}
                  >
                    {playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5" aria-hidden />}
                    {playing ? t("cook.pause") : t("cook.play")}
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => void speakStep(i)} aria-label={t("cook.repeat")}>
                    <RotateCcw className="size-5" aria-hidden />
                  </Button>
                  <button
                    type="button"
                    onClick={() => {
                      const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1;
                      setRate(next);
                      if (audioRef.current) audioRef.current.playbackRate = next;
                      savePref({ narrationRate: next });
                    }}
                    className="h-13 min-w-14 rounded-2xl border border-line px-3 font-semibold tabular"
                    aria-label={t("cook.speed")}
                  >
                    {rate}×
                  </button>
                  <button
                    type="button"
                    onClick={() => setVoiceCmd((v) => (savePref({ voiceCommands: !v }), !v))}
                    aria-pressed={voiceCmd}
                    aria-label={t("cook.voiceCommands")}
                    className={cn("ml-auto grid size-13 place-items-center rounded-2xl border", voiceCmd && voice.listening ? "border-forest bg-forest text-white" : "border-line")}
                  >
                    {voiceCmd ? <Mic className="size-5" /> : <MicOff className="size-5" />}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {languageInfo(narrKey === "en" ? (preferred === "en-IN" ? "en-IN" : "en") : narrKey).nativeName} ·{" "}
                  {audioMode === "cloud" ? t("cook.audio.cloud") : deviceVoice ? `${t("cook.audio.device")} (${deviceVoice.name})` : t("cook.audio.noVoice", { lang: languageInfo(narrKey).name })}
                  {voiceCmd && (voice.supported ? (voice.listening ? ` · ${t("cook.listening")}` : "") : ` · ${t("cook.voiceUnsupported")}`)}
                </p>
                {audioError && (
                  <div className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-sm text-[#6d4704]">
                    <p>{t(audioError as MessageKey, { lang: languageInfo(narrKey).name })}</p>
                    {audioError === "cook.audio.noVoice" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.premium && p.configured.tts && (
                          <Button size="sm" variant="secondary" onClick={() => (setAudioMode("cloud"), setAudioError(null))}>
                            {t("cook.audio.cloud")}
                          </Button>
                        )}
                        {narrKey !== "en" && (
                          <Button size="sm" variant="outline" onClick={() => (setNarrKey("en"), setAudioError(null))}>
                            {t("cook.audio.useEnglish")}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => (setPlaying(false), setAudioError(null))}>
                          {t("cook.audio.readOnly")}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="border-t border-line bg-surface px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-5xl items-stretch gap-2">
          <Button variant="outline" size="xl" className="px-4" onClick={() => go(i - 1)} disabled={i === 0} aria-label={t("cook.prev")}>
            <ArrowLeft className="size-6" aria-hidden />
            <span className="hidden sm:inline">{t("cook.prev")}</span>
          </Button>
          <Button
            variant={done.has(i) ? "secondary" : "outline"}
            size="xl"
            className="px-4"
            aria-pressed={done.has(i)}
            onClick={() =>
              setDone((d) => {
                const n = new Set(d);
                if (n.has(i)) n.delete(i);
                else n.add(i);
                return n;
              })
            }
          >
            <Check className="size-6" aria-hidden />
            <span className="hidden sm:inline">{done.has(i) ? t("cook.stepDone") : t("cook.markDone")}</span>
          </Button>
          <Button
            variant="lime"
            size="xl"
            className="flex-1"
            onClick={() => {
              setDone((d) => new Set(d).add(i));
              go(i + 1);
            }}
          >
            {i === total - 1 ? t("cook.finish") : t("cook.next")} <ArrowRight className="size-6" aria-hidden />
          </Button>
        </div>
      </footer>

      <Sheet open={showIngredients} onClose={() => setShowIngredients(false)} title={t("cook.ingredients")} closeLabel={t("common.close")}>
        <IngredientList
          lines={p.lines}
          baseServings={p.recipe.servings}
          servings={servings}
          onServings={setServings}
          units={units}
          onUnits={(u) => (setUnits(u), savePref({ units: u }))}
          checkable
          checked={checkedIngredients}
          onToggle={(id) =>
            setChecked((c) => {
              const n = new Set(c);
              if (n.has(id)) n.delete(id);
              else n.add(id);
              return n;
            })
          }
          large
        />
        {narrKey && deviceVoice && (
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={() =>
              speakDevice(
                ingredientsNarration(
                  narrationLang(narrKey),
                  servings,
                  p.lines.filter((l) => !l.optional).map((l) => `${displayQuantity(l, l, servings / p.recipe.servings, units).primary} ${narrKey === "en" ? l.name : localName(l, narrKey)}`),
                ),
              )
            }
          >
            <Play className="size-4" aria-hidden /> {t("cook.play")}
          </Button>
        )}
      </Sheet>

      <Sheet open={showSettings} onClose={() => setShowSettings(false)} title={t("nav.settings")} closeLabel={t("common.close")}>
        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-semibold">{t("cook.language")}</p>
            <div className="flex flex-wrap gap-2">
              {Object.keys(p.narrations).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => (setNarrKey(k), setSpeechTagOverride(null), stopAudio())}
                  aria-pressed={narrKey === k}
                  className={cn("rounded-full border px-3.5 py-2 text-sm font-semibold", narrKey === k ? "border-forest bg-forest text-white" : "border-line")}
                >
                  {languageInfo(k === "en" && preferred === "en-IN" ? "en-IN" : k).nativeName}
                </button>
              ))}
              {narrKey === "en" && (
                <button
                  type="button"
                  onClick={() => setSpeechTagOverride(speechTagOverride === "en-IN" ? "en-GB" : "en-IN")}
                  className="rounded-full border border-line px-3.5 py-2 text-sm font-semibold"
                >
                  {speechTag === "en-IN" ? "Indian English ✓" : "Indian English accent"}
                </button>
              )}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">{t("cook.audio.device")} / {t("cook.audio.cloud")}</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" aria-pressed={audioMode === "device"} onClick={() => setAudioMode("device")} className={cn("rounded-full border px-3.5 py-2 text-sm font-semibold", audioMode === "device" ? "border-forest bg-forest text-white" : "border-line")}>
                {t("cook.audio.device")}
              </button>
              <button
                type="button"
                aria-pressed={audioMode === "cloud"}
                disabled={!p.premium || !p.configured.tts}
                onClick={() => setAudioMode("cloud")}
                className={cn("rounded-full border px-3.5 py-2 text-sm font-semibold disabled:opacity-40", audioMode === "cloud" ? "border-forest bg-forest text-white" : "border-line")}
              >
                {t("cook.audio.cloud")}
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">{!p.premium ? t("cook.audio.cloudPremium") : !p.configured.tts ? t("sub.notConfigured") : t("common.remaining", { n: p.quota.cloudTts })}</p>
          </div>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">{t("settings.keepAwake")}</span>
            <input type="checkbox" className="size-5 accent-[var(--color-forest)]" checked={keepAwake} onChange={(e) => (setKeepAwake(e.target.checked), savePref({ keepAwake: e.target.checked }))} />
          </label>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold">{t("cook.voiceCommands")}</span>
            <input type="checkbox" className="size-5 accent-[var(--color-forest)]" checked={voiceCmd} onChange={(e) => (setVoiceCmd(e.target.checked), savePref({ voiceCommands: e.target.checked }))} />
          </label>
          <p className="text-xs text-muted">{t("cook.how4")}</p>
        </div>
      </Sheet>
    </div>
  );
}

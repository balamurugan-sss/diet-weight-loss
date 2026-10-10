"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Keeps the screen awake while cooking, re-acquiring after tab switches. */
export function useWakeLock(enabled: boolean) {
  const [active, setActive] = useState(false);
  const lock = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    if (!enabled || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock.current = await navigator.wakeLock.request("screen");
        if (cancelled) return void lock.current.release();
        setActive(true);
        lock.current.addEventListener("release", () => setActive(false));
      } catch {
        setActive(false);
      }
    };
    void acquire();
    const onVis = () => document.visibilityState === "visible" && void acquire();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      void lock.current?.release();
    };
  }, [enabled]);
  return active;
}

/** Device speech voices, which load asynchronously in most browsers. */
export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

export function pickVoice(voices: SpeechSynthesisVoice[], tag: string) {
  const lower = tag.toLowerCase();
  const base = lower.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === lower) ??
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === lower) ??
    (base === "en" ? voices.find((v) => v.lang.toLowerCase().startsWith("en")) : voices.find((v) => v.lang.toLowerCase().startsWith(base))) ??
    null
  );
}

/** Countdown that survives re-renders by tracking an absolute end time. */
export function useTimer(onDone: (durationSec: number) => void) {
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  }, [onDone]);
  useEffect(() => {
    if (!endsAt) return;
    const id = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= endsAt) {
        setEndsAt(null);
        done.current(duration);
      }
    }, 250);
    return () => clearInterval(id);
  }, [endsAt, duration]);
  const start = useCallback((sec: number) => {
    setDuration(sec);
    setNow(Date.now());
    setEndsAt(Date.now() + sec * 1000);
  }, []);
  const stop = useCallback(() => setEndsAt(null), []);
  const add = useCallback((sec: number) => setEndsAt((e) => (e ? e + sec * 1000 : e)), []);
  return { running: endsAt !== null, remaining: endsAt ? Math.max(0, Math.ceil((endsAt - now) / 1000)) : 0, duration, start, stop, add };
}

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>; resultIndex: number }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
};

const COMMANDS: Record<string, string[]> = {
  next: ["next", "forward", "அடுத்து", "அடுத்தது", "അടുത്തത്", "അടുത്ത"],
  back: ["back", "previous", "go back", "பின்", "முந்தைய", "പിന്നോട്ട്", "മുമ്പത്തെ"],
  repeat: ["repeat", "again", "மீண்டும்", "திரும்ப", "വീണ്ടും"],
  pause: ["pause", "stop", "நிறுத்து", "നിർത്തൂ", "നിർത്തുക"],
  timer: ["timer", "start timer", "டைமர்", "ടൈമർ"],
};

export function matchCommand(transcript: string): keyof typeof COMMANDS | null {
  const t = transcript.toLowerCase().trim();
  for (const [cmd, words] of Object.entries(COMMANDS)) if (words.some((w) => t.includes(w))) return cmd as keyof typeof COMMANDS;
  return null;
}

/** Hands-free navigation using the browser's speech recognition, where supported. */
export function useVoiceCommands(enabled: boolean, lang: string, onCommand: (c: string) => void) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const handler = useRef(onCommand);
  useEffect(() => {
    handler.current = onCommand;
  }, [onCommand]);
  useEffect(() => {
    const W = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    if (!enabled) return;
    let stopped = false;
    const rec = new Ctor();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const cmd = matchCommand(e.results[i][0].transcript);
        if (cmd) handler.current(cmd);
      }
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        stopped = true;
        setListening(false);
      }
    };
    rec.onend = () => {
      if (!stopped) {
        try {
          rec.start();
        } catch {
          setListening(false);
        }
      } else setListening(false);
    };
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
    return () => {
      stopped = true;
      rec.stop();
    };
  }, [enabled, lang]);
  return { supported, listening };
}

/** A short two-tone chime via Web Audio, so timers are audible without an asset file. */
export function chime() {
  try {
    const ctx = new AudioContext();
    [880, 660, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.28);
      g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.28 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.28 + 0.25);
      o.connect(g).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.28);
      o.stop(ctx.currentTime + i * 0.28 + 0.26);
    });
    navigator.vibrate?.([200, 100, 200]);
  } catch {}
}

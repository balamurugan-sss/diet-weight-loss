"use client";

import { FileUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Button, buttonClass } from "@/components/ui/Button";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { createAppleHealthParser } from "@/lib/health/apple";
import { createFitbitParser } from "@/lib/health/fitbit";
import { IMPORT_DAYS, type HealthImport as Parsed } from "@/lib/health/types";
import { importHealthAction } from "@/server/actions/health";

const sinceDate = () => new Date(Date.now() - IMPORT_DAYS * 86400000).toISOString().slice(0, 10);

/** Reads Apple Health / Fitbit / CSV exports in the browser; only daily totals are sent to the server. */
export function HealthImport() {
  const { t } = useI18n();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [result, setResult] = useState<{ source: "apple_health" | "fitbit_export" | "google_fit_export"; data: Parsed } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  async function read(files: FileList) {
    setMessage(null);
    setResult(null);
    const list = [...files];
    if (list.some((f) => f.name.toLowerCase().endsWith(".zip"))) return setMessage(t("health.import.zip"));
    const since = sinceDate();
    const xml = list.find((f) => f.name.toLowerCase().endsWith(".xml"));
    try {
      if (xml) {
        const parser = createAppleHealthParser(since);
        const reader = xml.stream().pipeThrough(new TextDecoderStream()).getReader();
        let done = 0;
        setPct(0);
        for (;;) {
          const { value, done: end } = await reader.read();
          if (end) break;
          parser.push(value);
          done += value.length;
          setPct(Math.min(99, Math.round((done / xml.size) * 100)));
        }
        const data = parser.finish();
        setPct(null);
        if (!data.days.length && !data.workouts.length) return setMessage(t("health.import.nothing"));
        return setResult({ source: "apple_health", data });
      }
      // Fitbit intraday timestamps are UTC; shift them to this phone's time zone.
      const parser = createFitbitParser(since, -new Date().getTimezoneOffset());
      setPct(0);
      for (const [i, f] of list.entries()) {
        const text = await f.text();
        if (f.name.toLowerCase().endsWith(".csv")) parser.addCsv(text, f.webkitRelativePath || f.name);
        else parser.addJson(f.name, JSON.parse(text));
        setPct(Math.round(((i + 1) / list.length) * 100));
      }
      const data = parser.finish();
      setPct(null);
      if (!data.days.length && !data.workouts.length) return setMessage(t("health.import.nothing"));
      setResult({ source: parser.source(), data });
    } catch {
      setPct(null);
      setMessage(t("health.importInvalid"));
    }
  }

  const save = () =>
    result &&
    start(async () => {
      // Keep the request small: newest 180 days / 1000 workouts at most.
      const res = await importHealthAction({ source: result.source, days: result.data.days.slice(-180), workouts: result.data.workouts.slice(-1000) });
      if (res.ok) {
        setResult(null);
        setMessage(t("health.import.saved", { days: res.days, workouts: res.workouts }));
        router.refresh();
      } else setMessage(t(res.error as MessageKey));
    });

  return (
    <div className="space-y-3">
      <ul className="space-y-1.5 text-sm leading-relaxed text-ink-2">
        <li>• {t("health.import.apple")}</li>
        <li>• {t("health.import.fitbit")}</li>
        <li>• {t("health.import.googleFit")}</li>
        <li>• {t("health.import.csv")}</li>
      </ul>
      <input
        ref={input}
        type="file"
        multiple
        accept=".xml,.json,.csv,application/json,text/xml,text/csv"
        className="sr-only"
        onChange={(e) => e.target.files?.length && void read(e.target.files)}
        aria-label={t("health.import.choose")}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={buttonClass("outline", "md")} onClick={() => input.current?.click()} disabled={pct !== null || pending}>
          <FileUp className="size-5" aria-hidden /> {t("health.import.choose")}
        </button>
        {pct !== null && (
          <span className="text-sm font-medium text-muted tabular" aria-live="polite">
            {t("health.import.reading", { pct })}
          </span>
        )}
      </div>
      {result && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-forest-50 p-3">
          <p className="flex-1 text-[15px] font-medium text-forest">{t("health.import.found", { days: result.data.days.length, workouts: result.data.workouts.length })}</p>
          <Button variant="lime" size="sm" onClick={save} disabled={pending}>
            {pending ? t("common.saving") : t("health.import.save")}
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm font-medium text-ink-2">
          {message}
        </p>
      )}
    </div>
  );
}

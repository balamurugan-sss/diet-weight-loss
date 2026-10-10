import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { ScheduleForm } from "@/components/program/ScheduleForm";
import { SettingsList, TopBar } from "@/components/ui/TopBar";
import { ExerciseFigure } from "@/components/workouts/ExerciseFigure";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { requireOnboarded } from "@/server/auth/dal";
import { getI18n } from "@/server/i18n";
import { addDays } from "@/lib/workouts/progress";
import { getActiveProgram, getWorkoutProfile, programProgress } from "@/server/services/workouts";
import { todayISO } from "@/server/time";

export const metadata = { title: "Program settings" };

/** Program settings: what the plan is built from (place, goal, difficulty, equipment) and which weekdays to train. */
export default async function ProgramSettingsPage() {
  const { user } = await requireOnboarded();
  const { t, lang } = await getI18n();
  const locale = lang === "ta" ? "ta-IN" : lang === "ml" ? "ml-IN" : "en-IN";
  const [wp, program] = await Promise.all([getWorkoutProfile(user.id), getActiveProgram(user.id)]);
  // 2026-10-04 is a Sunday: label the circles S M T W T F S.
  const dow = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  const labels = Array.from({ length: 7 }, (_, d) => dow.format(new Date(Date.UTC(2026, 9, 4 + d))));
  // Without chosen weekdays, show the weekdays this week's calendar trains on (same as the My program strip).
  const sunday = addDays(todayISO(), -new Date(todayISO() + "T00:00:00Z").getUTCDay());
  const week = program && !wp?.weekdays?.length ? await programProgress(program, [sunday, addDays(sunday, 6)]) : null;
  const current = wp?.weekdays?.length
    ? wp.weekdays
    : (week?.cells.filter((c) => c.kind === "workout").map((c) => new Date(c.date + "T00:00:00Z").getUTCDay()) ?? []);

  const equipment = !wp
    ? null
    : wp.location === "gym"
      ? t("wk.loc.gym")
      : wp.equipment.length
        ? wp.equipment.map((e) => t(`wk.eq.${e}` as MessageKey)).join(", ")
        : t("tag.noEquipment");
  const rows: [string, string | null][] = [
    [t("program.place"), wp ? t(`wk.loc.${wp.location}`) : null],
    [t("program.goal"), wp ? t(`wk.goal.${wp.goal}`) : null],
    [t("program.difficulty"), wp ? t(`wk.level.${wp.level}`) : null],
    [t("program.equipment"), equipment],
  ];

  return (
    <div>
      <TopBar title={t("program.settings")} back="/home" backLabel={t("common.back")} />
      <section className="mb-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-[1.6rem] font-extrabold">{t("program.my")}</h2>
          <Link href="/workouts/setup" className="font-semibold text-lime">
            {t("program.change")}
          </Link>
        </div>
        <div className="mb-px flex items-center gap-4 rounded-t-md bg-surface p-4">
          <span className="grid size-20 shrink-0 place-items-center rounded-sm bg-sand">
            <ExerciseFigure pattern="press" label="" animate={false} className="size-16" />
          </span>
          <div className="min-w-0">
            <p className="text-lg font-bold">{program?.name ?? t("program.none")}</p>
            <p className="text-[15px] text-muted">{program ? t("program.daysPerWeek", { n: program.daysPerWeek }) : t("wk.home.setupBody")}</p>
          </div>
        </div>
        <SettingsList>
          {rows.map(([label, value]) => (
            <li key={label}>
              <Link href="/workouts/setup" className="flex min-h-14 items-center gap-3 px-4 hover:bg-sand/60">
                <span className="flex-1 text-[17px]">{label}</span>
                <span className="text-[15px] text-muted">{value ?? "—"}</span>
                <ChevronRight className="size-5 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </SettingsList>
      </section>

      <section>
        <h2 className="mb-3 text-[1.6rem] font-extrabold">{t("program.schedule")}</h2>
        {wp ? <ScheduleForm initial={current} labels={labels} /> : <p className="rounded-md bg-surface p-4 text-muted">{t("program.schedule.setupFirst")}</p>}
      </section>
    </div>
  );
}

import type { MessageKey } from "@/lib/i18n/messages/en";
import type { TFunc } from "@/lib/i18n/t";
import type { ProgramDay } from "./types";

/** A day's display title: guide programs carry their own; generated ones use the focus label. */
export function dayTitle(day: Pick<ProgramDay, "focus" | "title" | "kind">, t: TFunc) {
  if (day.title) return day.title;
  if (day.kind === "recovery") return t("wk.recoveryDay");
  if (day.kind === "rest") return t("wk.restDay");
  return t(`wk.focus.${day.focus}` as MessageKey);
}

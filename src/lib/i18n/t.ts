import type { MessageKey, Messages } from "./messages/en";

export type TFunc = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function makeT(dict: Messages): TFunc {
  return (key, vars) => {
    let s: string = dict[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}

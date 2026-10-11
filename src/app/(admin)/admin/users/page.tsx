import { ChevronRight, Crown, Search } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";
import { inputClass } from "@/components/auth/LoginForm";
import { fmtDate } from "@/lib/admin/format";
import { cn } from "@/lib/cn";
import { requireAdmin } from "@/server/admin";
import { getI18n } from "@/server/i18n";
import { listUsers, PAGE_SIZE, type UserFilter } from "@/server/services/admin";
import { APP_TIMEZONE } from "@/server/time";

export const metadata = { title: "Users" };

const FILTERS: UserFilter[] = ["all", "premium", "free", "new", "inactive"];

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsers({ searchParams }: { searchParams: SP }) {
  await requireAdmin();
  const { t } = await getI18n();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const filter = FILTERS.includes(sp.f as UserFilter) ? (sp.f as UserFilter) : "all";
  const page = Math.max(1, Number(sp.page) || 1);
  const { rows, total } = await listUsers({ q, filter, page });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (o: { f?: UserFilter; page?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const f = o.f ?? filter;
    if (f !== "all") p.set("f", f);
    if (o.page && o.page > 1) p.set("page", String(o.page));
    const s = p.toString();
    return s ? `/admin/users?${s}` : "/admin/users";
  };
  const chip = (on: boolean) => cn("inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium", on ? "border-lime bg-lime text-on-accent" : "border-line bg-surface");

  return (
    <div className="space-y-5">
      <h1 className="text-[1.8rem] font-extrabold">{t("admin.nav.users")}</h1>
      <form className="flex gap-2" role="search">
        {filter !== "all" && <input type="hidden" name="f" value={filter} />}
        <label className="relative flex-1">
          <span className="sr-only">{t("admin.users.search")}</span>
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" aria-hidden />
          <input name="q" defaultValue={q} placeholder={t("admin.users.search")} className={cn(inputClass, "pl-11")} />
        </label>
        <button type="submit" className={buttonClass("lime", "lg")}>
          {t("admin.users.searchBtn")}
        </button>
      </form>
      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link key={f} href={href({ f })} className={chip(filter === f)} aria-current={filter === f ? "true" : undefined}>
            {t(`admin.users.filter.${f}`)}
          </Link>
        ))}
      </div>
      <p className="text-sm text-muted">{t("admin.users.count", { n: total })}</p>
      {rows.length === 0 ? (
        <p className="rounded-md bg-surface p-5 text-muted">{t("admin.users.none")}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-md bg-surface">
          {rows.map((u) => (
            <li key={u.id}>
              <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-sand">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sand font-bold uppercase">{(u.displayName ?? u.email ?? "?").slice(0, 1)}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{u.displayName ?? "—"}</span>
                    {u.isPremium && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-tag px-2 py-0.5 text-[11px] font-bold text-white uppercase">
                        <Crown className="size-3" aria-hidden /> {t("common.premium")}
                      </span>
                    )}
                    {!u.onboarded && <span className="shrink-0 text-xs text-amber-ink">{t("admin.users.setup")}</span>}
                  </span>
                  <span className="block truncate text-sm text-muted">{u.email}</span>
                  <span className="block text-xs text-muted">
                    {t("admin.users.joined", { date: fmtDate(u.createdAt, APP_TIMEZONE) })} ·{" "}
                    {u.lastActiveAt ? t("admin.users.active", { date: fmtDate(u.lastActiveAt, APP_TIMEZONE) }) : t("admin.users.never")}
                  </span>
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between">
          {page > 1 ? (
            <Link href={href({ page: page - 1 })} className={buttonClass("outline", "sm")}>
              {t("admin.users.prev")}
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-muted">{t("admin.users.page", { page, pages })}</span>
          {page < pages ? (
            <Link href={href({ page: page + 1 })} className={buttonClass("outline", "sm")}>
              {t("admin.users.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

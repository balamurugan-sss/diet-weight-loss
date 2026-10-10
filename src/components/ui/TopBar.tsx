import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/** Screen header: back chevron, centred title, optional action on the right. */
export function TopBar({ title, back, backLabel, action }: { title: string; back?: string; backLabel?: string; action?: React.ReactNode }) {
  return (
    <header className="-mx-4 -mt-5 mb-5 grid min-h-14 grid-cols-[3rem_1fr_3rem] items-center bg-surface px-1 sm:mx-0 sm:mt-0 sm:rounded-md">
      {back ? (
        <Link href={back} className="grid size-12 place-items-center text-lime" aria-label={backLabel}>
          <ChevronLeft className="size-7" aria-hidden />
        </Link>
      ) : (
        <span />
      )}
      <h1 className="truncate text-center text-[1.2rem] font-bold">{title}</h1>
      <span className="flex justify-end">{action}</span>
    </header>
  );
}

/** Grouped settings rows: label on the left, value and chevron on the right. */
export function SettingsList({ children }: { children: React.ReactNode }) {
  return <ul className="divide-y divide-line overflow-hidden rounded-md bg-surface">{children}</ul>;
}

"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { removeQuickLogAction } from "@/server/actions/today";

export function RemoveLogButton({ logId, label }: { logId: string; label: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      aria-label={label}
      onClick={() =>
        start(async () => {
          const res = await removeQuickLogAction(logId);
          if (res.ok) router.refresh();
        })
      }
      className="grid size-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-sand hover:text-terracotta disabled:opacity-50"
    >
      <X className="size-4" aria-hidden />
    </button>
  );
}

"use client";

import { RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "@/components/brand/Brand";
import { buttonClass } from "@/components/ui/Button";

/** Error boundary for every route below the root layout. */
export default function Error({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-12">
      <LogoMark />
      <h1 className="text-[1.9rem] leading-tight">Something went wrong</h1>
      <p className="text-[15px] leading-relaxed text-ink-2">
        We couldn&apos;t load this page. Your data is safe — please try again in a moment. If it keeps happening, share the reference below with
        support.
      </p>
      {error.digest && (
        <p className="rounded-2xl bg-sand px-4 py-3 font-mono text-sm text-muted">
          Reference: <span className="text-charcoal select-all">{error.digest}</span>
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        <button type="button" onClick={() => unstable_retry()} className={buttonClass("lime", "lg")}>
          <RotateCcw className="size-5" aria-hidden /> Try again
        </button>
        <Link href="/" className={buttonClass("outline", "lg")}>
          Go to start
        </Link>
      </div>
    </main>
  );
}

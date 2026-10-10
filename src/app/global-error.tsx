"use client";

import { useEffect } from "react";
import "./globals.css";

/** Last-resort boundary for errors in the root layout itself. It replaces <html>, so it can't use the app's providers. */
export default function GlobalError({ error, unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased">
        <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-5 px-6 py-12">
          <h1 className="text-[1.9rem] leading-tight font-bold">Something went wrong</h1>
          <p className="text-[15px] leading-relaxed text-ink-2">We couldn&apos;t load Thali right now. Please try again in a moment.</p>
          {error.digest && (
            <p className="rounded-2xl bg-sand px-4 py-3 font-mono text-sm text-muted">
              Reference: <span className="text-charcoal select-all">{error.digest}</span>
            </p>
          )}
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="inline-flex h-13 w-fit items-center rounded-xl bg-lime px-6 font-bold text-[#0c0c0b] hover:bg-lime-600"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}

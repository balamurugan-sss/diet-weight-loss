import { AlertTriangle, Lightbulb } from "lucide-react";
import type { GuideBlock, GuideSection } from "@/lib/guides/types";
import { Quiz } from "./GuideClient";

function Block({ b }: { b: GuideBlock }) {
  switch (b.kind) {
    case "p":
      return <p className="text-[16px] leading-relaxed text-ink-2">{b.text}</p>;
    case "h":
      return <h3 className="pt-2 text-[1.1rem] font-bold">{b.text}</h3>;
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return (
        <L className={b.ordered ? "list-decimal space-y-1.5 pl-6 text-[16px] text-ink-2" : "list-disc space-y-1.5 pl-6 text-[16px] text-ink-2"}>
          {b.items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </L>
      );
    }
    case "checklist":
      return (
        <ul className="space-y-2">
          {b.items.map((x) => (
            <li key={x} className="flex items-start gap-3 text-[16px]">
              <span className="mt-0.5 size-5 shrink-0 rounded-sm border-2 border-muted print:border-black" aria-hidden />
              {x}
            </li>
          ))}
        </ul>
      );
    case "table":
      return (
        <div className="-mx-4 overflow-x-auto px-4 print:mx-0 print:px-0">
          <table className="w-full min-w-[30rem] border-collapse text-left text-[14px]">
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th key={h} className="border-b-2 border-line px-2 py-2 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-b border-line">
                  {r.map((c, j) => (
                    <td key={j} className="px-2 py-2 align-top text-ink-2">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "tip":
      return (
        <p className="flex gap-2 rounded-md bg-forest-50 p-3 text-[15px] text-ink-2">
          <Lightbulb className="mt-0.5 size-4.5 shrink-0 text-lime" aria-hidden /> {b.text}
        </p>
      );
    case "caution":
      return (
        <p className="flex gap-2 rounded-md bg-amber-100 p-3 text-[15px] text-amber-ink">
          <AlertTriangle className="mt-0.5 size-4.5 shrink-0" aria-hidden /> {b.text}
        </p>
      );
    case "log":
      return (
        <div className="-mx-4 overflow-x-auto px-4 print:mx-0 print:px-0">
          <table className="w-full min-w-[30rem] border-collapse text-[13px]">
            <thead>
              <tr>
                {b.head.map((h) => (
                  <th key={h} className="border border-line px-2 py-1.5 text-left font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: b.rows }, (_, i) => (
                <tr key={i}>
                  {b.head.map((h) => (
                    <td key={h} className="h-9 border border-line px-2" />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "quiz":
      return <Quiz block={b} />;
  }
}

/** Renders a guide's sections; prints cleanly (the app chrome is hidden in print). */
export function GuideBody({ sections }: { sections: GuideSection[] }) {
  return (
    <div className="space-y-8">
      {sections.map((s) => (
        <section key={s.heading} className="space-y-3 break-inside-avoid-page">
          <h2 className="border-b-2 border-line pb-2 text-[1.3rem] font-bold">{s.heading}</h2>
          {s.blocks.map((b, i) => (
            <Block key={i} b={b} />
          ))}
        </section>
      ))}
    </div>
  );
}

import { describe, expect, it } from "vitest";
import { ARTICLE_GUIDES } from "@/lib/guides/articles";
import type { Guide, GuideBlock } from "@/lib/guides/types";
import { PATTERNS } from "@/lib/workouts/types";

const blocks = (g: Guide): GuideBlock[] => g.sections.flatMap((s) => s.blocks);
const bySlug = (slug: string) => {
  const g = ARTICLE_GUIDES.find((x) => x.slug === slug);
  if (!g) throw new Error(`missing guide ${slug}`);
  return g;
};

describe("article guides", () => {
  it("has the nine trending guides with unique slugs", () => {
    expect(ARTICLE_GUIDES).toHaveLength(9);
    const slugs = ARTICLE_GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(ARTICLE_GUIDES.map((g) => [g.slug, g] as const))("%s is well formed", (_slug, g) => {
    expect(g.category).toBe("trending");
    expect(g.programId).toBeUndefined();
    expect(g.title.trim()).not.toBe("");
    expect(g.summary.length).toBeGreaterThan(0);
    expect(g.summary.length).toBeLessThanOrEqual(220);
    expect(g.tags.length).toBeGreaterThanOrEqual(2);
    expect(g.tags.length).toBeLessThanOrEqual(4);
    for (const t of g.tags) expect(t).toBe(t.toUpperCase());
    expect(g.readMinutes).toBeGreaterThan(0);
    expect(PATTERNS).toContain(g.pattern);
    expect(g.sections.length).toBeGreaterThanOrEqual(3);
    for (const s of g.sections) {
      expect(s.heading.trim()).not.toBe("");
      expect(s.blocks.length).toBeGreaterThan(0);
    }
    expect(g.sources.length).toBeGreaterThanOrEqual(3);
    expect(g.sources.length).toBeLessThanOrEqual(6);
    for (const src of g.sources) {
      expect(src.title.trim()).not.toBe("");
      expect(() => new URL(src.url)).not.toThrow();
      expect(new URL(src.url).protocol).toBe("https:");
    }
    expect(new Set(g.sources.map((s) => s.url)).size).toBe(g.sources.length);
  });

  it("tables and logs are consistent", () => {
    for (const g of ARTICLE_GUIDES) {
      for (const b of blocks(g)) {
        if (b.kind === "table") for (const row of b.rows) expect(row).toHaveLength(b.head.length);
        if (b.kind === "log") expect(b.rows).toBeGreaterThan(0);
        if (b.kind === "list" || b.kind === "checklist") expect(b.items.length).toBeGreaterThan(0);
      }
    }
  });

  it("sleep guide has a checklist and a 14-night diary", () => {
    const b = blocks(bySlug("better-sleep-guide"));
    expect(b.some((x) => x.kind === "checklist")).toBe(true);
    const log = b.find((x) => x.kind === "log");
    expect(log && log.kind === "log" && log.rows).toBe(14);
  });

  it("metabolic guide has a quiz whose outcomes all exist", () => {
    const quiz = blocks(bySlug("metabolic-types")).find((x) => x.kind === "quiz");
    expect(quiz).toBeDefined();
    if (!quiz || quiz.kind !== "quiz") return;
    const keys = Object.keys(quiz.outcomes);
    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(quiz.questions.length).toBeGreaterThanOrEqual(3);
    const used = new Set<string>();
    for (const q of quiz.questions) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
      for (const o of q.options) {
        expect(keys).toContain(o.outcome);
        used.add(o.outcome);
      }
    }
    // Every outcome is reachable.
    expect([...used].sort()).toEqual([...keys].sort());
  });

  it("get-shredded guide has 11 ordered steps", () => {
    const steps = bySlug("get-shredded-11-steps")
      .sections.map((s) => /^Step (\d+):/.exec(s.heading))
      .filter((m): m is RegExpExecArray => m !== null)
      .map((m) => Number(m[1]));
    expect(steps).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });
});

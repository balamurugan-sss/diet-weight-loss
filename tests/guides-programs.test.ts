import { describe, expect, it } from "vitest";
import { PROGRAMS, PROGRAM_GUIDES } from "@/lib/guides/programs";
import type { TemplateItem } from "@/lib/guides/types";
import { EXERCISE_BY_ID, getExercise } from "@/lib/workouts/exercises";
import { GUIDE_EXERCISES } from "@/lib/workouts/exercises-guides";
import { estimatePrescriptions } from "@/lib/workouts/load";
import { PATTERNS } from "@/lib/workouts/types";

const items = (d: { warmup: TemplateItem[]; main: TemplateItem[]; cooldown: TemplateItem[] }) => [...d.warmup, ...d.main, ...d.cooldown];
const minutes = (list: TemplateItem[]) => estimatePrescriptions(list.map((p, slot) => ({ ...p, slot })), 70).minutes;

describe("guide exercises", () => {
  it("are all guide-only home moves with complete metadata", () => {
    expect(GUIDE_EXERCISES.length).toBeGreaterThan(0);
    for (const e of GUIDE_EXERCISES) {
      expect(e.guideOnly, e.id).toBe(true);
      expect(e.settings, e.id).toEqual(["home"]);
      expect(PATTERNS).toContain(e.pattern);
      expect(e.steps.length, e.id).toBeGreaterThanOrEqual(3);
      expect(e.steps.length, e.id).toBeLessThanOrEqual(4);
      expect(e.mistakes.length, e.id).toBe(2);
      expect(e.met, e.id).toBeGreaterThan(1);
      expect(e.met, e.id).toBeLessThanOrEqual(10);
      if (e.mode === "reps") expect(e.secPerRep, e.id).toBeGreaterThan(0);
      expect(e.id).toMatch(/^[a-z0-9]+(_[a-z0-9]+)*$/);
    }
  });

  it("do not clash with each other or the main library", () => {
    const ids = GUIDE_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(EXERCISE_BY_ID.get(id)?.guideOnly, id).toBe(true);
  });
});

describe("program templates", () => {
  it("use only known exercises, with reps for rep moves and seconds for timed moves", () => {
    for (const p of PROGRAMS) {
      for (const d of p.days) {
        for (const it of items(d)) {
          const ex = getExercise(it.exerciseId);
          const where = `${p.id} / ${d.title} / ${it.exerciseId}`;
          expect(it.sets, where).toBeGreaterThan(0);
          expect(it.restSec, where).toBeGreaterThanOrEqual(0);
          if (ex.mode === "reps") {
            expect(it.reps, where).toBeDefined();
            expect(it.seconds, where).toBeUndefined();
            expect(it.reps![0], where).toBeGreaterThan(0);
            expect(it.reps![0], where).toBeLessThanOrEqual(it.reps![1]);
          } else {
            expect(it.seconds, where).toBeGreaterThan(0);
            expect(it.reps, where).toBeUndefined();
          }
        }
      }
    }
  });

  it("have well-formed days of a sensible length", () => {
    for (const p of PROGRAMS) {
      expect(p.days.length, p.id).toBeGreaterThanOrEqual(14);
      expect(p.days.some((d) => d.kind === "rest" || d.kind === "recovery"), p.id).toBe(true);
      for (const d of p.days) {
        const where = `${p.id} / ${d.title}`;
        if (d.kind === "rest") {
          expect(items(d), where).toHaveLength(0);
          continue;
        }
        expect(d.main.length, where).toBeGreaterThanOrEqual(1);
        expect(d.main.length, where).toBeLessThanOrEqual(8);
        expect(d.cooldown.length, where).toBeLessThanOrEqual(3);
        expect(d.warmup.length, where).toBeLessThanOrEqual(3);
        const min = minutes(items(d));
        if (d.kind === "workout") {
          expect(d.warmup.length, where).toBeGreaterThanOrEqual(1);
          expect(d.main.length, where).toBeGreaterThanOrEqual(3);
          expect(d.cooldown.length, where).toBeGreaterThanOrEqual(1);
          expect(min, where).toBeGreaterThanOrEqual(10);
        } else {
          expect(min, where).toBeGreaterThanOrEqual(5);
        }
        expect(min, where).toBeLessThanOrEqual(40);
      }
    }
  });

  it("only use equipment the template lists", () => {
    for (const p of PROGRAMS) {
      for (const d of p.days) {
        for (const it of items(d)) {
          for (const eq of getExercise(it.exerciseId).equipment) {
            expect(p.equipment as string[], `${p.id} / ${it.exerciseId}`).toContain(eq);
          }
        }
      }
    }
  });

  it("keep chair and tai chi programs upright (no lying on the back)", () => {
    const upright = PROGRAMS.filter((p) => p.id.includes("tai-chi"));
    expect(upright.length).toBeGreaterThanOrEqual(5);
    for (const p of upright) {
      for (const d of p.days) {
        for (const it of items(d)) expect(getExercise(it.exerciseId).supine, `${p.id} / ${it.exerciseId}`).toBeFalsy();
      }
    }
  });

  it("get harder from the first week to the last", () => {
    const work = (days: typeof PROGRAMS[number]["days"]) =>
      days.filter((d) => d.kind === "workout").reduce((sum, d) => sum + minutes(items(d)), 0);
    for (const p of PROGRAMS) {
      const first = work(p.days.slice(0, 7));
      const last = work(p.days.slice(-7));
      expect(last, p.id).toBeGreaterThan(first);
    }
  });
});

describe("program guides", () => {
  it("link one-to-one with templates and have unique slugs and ids", () => {
    expect(PROGRAM_GUIDES).toHaveLength(9);
    expect(PROGRAMS).toHaveLength(9);
    const slugs = PROGRAM_GUIDES.map((g) => g.slug);
    const ids = PROGRAMS.map((p) => p.id);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(ids).size).toBe(ids.length);
    for (const g of PROGRAM_GUIDES) {
      const p = PROGRAMS.find((x) => x.id === g.programId);
      expect(p, g.slug).toBeDefined();
      expect(p!.guideSlug, g.slug).toBe(g.slug);
    }
    for (const p of PROGRAMS) expect(slugs, p.id).toContain(p.guideSlug);
  });

  it("are complete program articles with sources", () => {
    for (const g of PROGRAM_GUIDES) {
      expect(g.category, g.slug).toBe("program");
      expect(PATTERNS).toContain(g.pattern);
      expect(g.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(g.tags.length, g.slug).toBeGreaterThan(0);
      for (const tag of g.tags) expect(tag, g.slug).toBe(tag.toUpperCase());
      expect(g.readMinutes, g.slug).toBeGreaterThanOrEqual(2);
      expect(g.caution, g.slug).toBeTruthy();
      expect(g.sources.length, g.slug).toBeGreaterThanOrEqual(2);
      expect(g.sources.length, g.slug).toBeLessThanOrEqual(5);
      for (const s of g.sources) {
        expect(s.url, g.slug).toMatch(/^https:\/\/[^\s]+$/);
        expect(s.title, g.slug).toBeTruthy();
      }
      const blocks = g.sections.flatMap((s) => s.blocks);
      const kinds = new Set(blocks.map((b) => b.kind));
      expect(kinds.has("table"), `${g.slug} schedule table`).toBe(true);
      expect(kinds.has("caution"), `${g.slug} safety`).toBe(true);
      expect(kinds.has("checklist") || kinds.has("log"), `${g.slug} tracker`).toBe(true);
      for (const b of blocks) {
        if (b.kind === "table") for (const row of b.rows) expect(row.length, g.slug).toBe(b.head.length);
      }
    }
  });
});

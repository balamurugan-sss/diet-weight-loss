import { describe, expect, it } from "vitest";
import { heroPrompt, sceneState, stepPrompt, type PromptRecipe } from "@/lib/media/prompts";
import { stepNarration, timerDoneNarration } from "@/lib/i18n/narration";

const r: PromptRecipe = {
  title: "Paneer Tikka",
  cuisine: "north_indian",
  description: "Smoky paneer skewers.",
  steps: [
    { stepIndex: 0, title: "Cut", kind: "prep", uses: ["paneer", "capsicum"], visual: "paneer and capsicum cubes on a board", tempC: null, timerSec: null },
    { stepIndex: 1, title: "Marinate", kind: "prep", uses: ["curd", "chilli"], visual: "a steel mixing bowl of red marinade", tempC: null, timerSec: 1800 },
    { stepIndex: 2, title: "Cook", kind: "cook", uses: [], visual: "skewers in an air-fryer basket", tempC: 200, timerSec: 720 },
    { stepIndex: 3, title: "Serve", kind: "serve", uses: ["chaat_masala"], visual: "tikka on a white plate", tempC: null, timerSec: null },
  ],
};
const all = ["paneer", "capsicum", "curd", "chilli", "chaat_masala", "salt"];
const name = (id: string) => id.replace("_", " ");

describe("image prompt continuity", () => {
  it("tracks introduced and future ingredients", () => {
    expect(sceneState(r.steps, 0, all)).toEqual({ introduced: ["paneer", "capsicum"], future: ["curd", "chilli", "chaat_masala"] });
    expect(sceneState(r.steps, 3, all).future).toEqual([]);
  });
  it("forbids not-yet-added ingredients and the finished dish before the last step", () => {
    const p = stepPrompt(r, 0, all, name, false);
    expect(p).toMatch(/Do NOT show these yet.*curd/);
    expect(p).toMatch(/do not show the finished/);
    expect(p).not.toMatch(/Ingredients that may be visible.*curd/);
  });
  it("final step may show the finished dish", () => {
    const p = stepPrompt(r, 3, all, name, true);
    expect(p).not.toMatch(/do not show the finished/);
    expect(p).toMatch(/reference image/);
  });
  it("keeps the same vessel across cooking steps", () => {
    expect(stepPrompt(r, 2, all, name, false)).toMatch(/same air-fryer basket/);
    expect(stepPrompt(r, 2, all, name, false)).toMatch(/200°C/);
  });
  it("hero prompt uses validated presentation text", () => {
    expect(heroPrompt(r, name)).toMatch(/tikka on a white plate/);
  });
});

describe("narration", () => {
  it("speaks time and temperature from structured data", () => {
    const s = stepNarration("en", { text: "Air fry until charred.", timerSec: 720, tempC: 200 }, 3, 4);
    expect(s).toBe("Step 3 of 4. Air fry until charred. The temperature is 200 degrees Celsius. Set a timer for 12 minutes.");
  });
  it("Tamil and Malayalam templates", () => {
    expect(timerDoneNarration("ta", 600)).toBe("10 நிமிட டைமர் முடிந்தது.");
    expect(stepNarration("ml", { text: "എണ്ണ ചൂടാക്കുക.", timerSec: null, tempC: null }, 1, 5)).toBe("ഘട്ടം 1, ആകെ 5. എണ്ണ ചൂടാക്കുക.");
  });
});

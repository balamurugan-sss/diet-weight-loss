import { describe, expect, it } from "vitest";
import { premiumEnd, safeLink } from "@/lib/admin/rules";

describe("premium grants", () => {
  const now = new Date("2026-10-11T10:00:00Z");
  it("adds months from today, or from a later end date", () => {
    expect(premiumEnd(null, false, 3, now)?.toISOString()).toBe("2027-01-11T10:00:00.000Z");
    expect(premiumEnd(new Date("2026-12-01T00:00:00Z"), true, 1, now)?.toISOString()).toBe("2027-01-01T00:00:00.000Z");
    // An expired end date doesn't count.
    expect(premiumEnd(new Date("2026-01-01T00:00:00Z"), false, 1, now)?.toISOString()).toBe("2026-11-11T10:00:00.000Z");
  });
  it("never shortens premium that has no end date", () => {
    expect(premiumEnd(null, true, 1, now)).toBeNull();
    expect(premiumEnd(new Date("2026-12-01T00:00:00Z"), true, null, now)).toBeNull();
  });
});

describe("message links", () => {
  it("allows app paths and https only", () => {
    expect(safeLink("/explore")).toBe("/explore");
    expect(safeLink(" /explore/tai-chi-guide?x=1 ")).toBe("/explore/tai-chi-guide?x=1");
    expect(safeLink("https://example.com/offer")).toBe("https://example.com/offer");
    expect(safeLink("")).toBeNull();
    expect(safeLink("//evil.example")).toBeNull();
    expect(safeLink("http://example.com")).toBeNull();
    expect(safeLink("javascript:alert(1)")).toBeNull();
    expect(safeLink("/a\"><script>")).toBeNull();
  });
});

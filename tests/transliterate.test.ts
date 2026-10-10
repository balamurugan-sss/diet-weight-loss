import { describe, expect, it } from "vitest";
import { transliterate } from "@/lib/i18n/transliterate";

describe("transliteration", () => {
  it("Tamil", () => {
    expect(transliterate("வெங்காயம்", "ta")).toBe("vengaayam");
    expect(transliterate("தக்காளி", "ta")).toBe("thakkaali");
    expect(transliterate("கறிவேப்பிலை", "ta")).toBe("kariveppilai");
    expect(transliterate("பச்சை மிளகாய்", "ta")).toBe("pachchai milagaay");
  });
  it("Malayalam, including chillu letters", () => {
    expect(transliterate("തക്കാളി", "ml")).toBe("thakkaali");
    expect(transliterate("വെളിച്ചെണ്ണ", "ml")).toBe("velichchenna");
    expect(transliterate("പനീർ", "ml")).toBe("paneer");
  });
  it("leaves other scripts alone", () => {
    expect(transliterate("Paneer 200 g", "ta")).toBe("Paneer 200 g");
  });
});

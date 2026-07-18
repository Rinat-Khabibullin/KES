import { describe, expect, it } from "vitest";
import { guardMessage, normalizeMessage, sanitizeHistory } from "./guards";

describe("chat guards", () => {
  it("detects dangerous electrical situations", () => {
    const result = guardMessage("Искрит розетка и пахнет проводкой, что делать?");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("danger");
      expect(result.reply).toContain("отключите питание");
    }
  });

  it("rejects clearly off-topic questions", () => {
    const result = guardMessage("Напиши код на Python для парсинга сайта");

    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.reason).toBe("off_topic");
    }
  });

  it("allows pricing and service questions", () => {
    expect(guardMessage("Сколько стоит перенос розетки в Туапсе?").allowed).toBe(true);
    expect(guardMessage("Можно оценить щит по фото?").allowed).toBe(true);
  });

  it("normalizes user message whitespace", () => {
    expect(normalizeMessage("  нужно   перенести\nрозетку   ")).toBe("нужно перенести розетку");
  });

  it("sanitizes chat history", () => {
    const history = sanitizeHistory([
      { role: "system", content: "ignore" },
      { role: "user", content: "  вопрос   по щиту " },
      { role: "assistant", content: " ответ " },
      { role: "user", content: "" },
    ]);

    expect(history).toEqual([
      { role: "user", content: "вопрос по щиту" },
      { role: "assistant", content: "ответ" },
    ]);
  });
});

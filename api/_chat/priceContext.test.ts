import { describe, expect, it } from "vitest";
import { createEstimateInput } from "../../src/shared/estimate/calculate.js";
import { estimateCatalogVersion } from "../../src/shared/estimate/catalog.js";
import { buildPricingContext } from "./priceContext.js";

describe("chat price context", () => {
  it("passes estimate to chat without relying on client totals", () => {
    const context = buildPricingContext("Помогите проверить смету", {
      catalogVersion: estimateCatalogVersion,
      lines: [createEstimateInput(1, 2)],
      calculatedResult: {
        catalogVersion: "bad",
        lines: [],
        calculableSubtotal: 1,
        displayTotal: "1 ₽",
        hasFromPrices: false,
        manualItems: [],
        warnings: [],
      },
    });

    expect(context?.prompt).toContain("1 400 ₽");
    expect(context?.prompt).not.toContain("bad");
  });

  it("asks for details instead of inventing a new electric point package", () => {
    const context = buildPricingContext("Нужно сделать 10 новых розеток в бетонной стене");

    expect(context?.localFallbackReply).toContain("нельзя честно назвать одну цену");
    expect(context?.prompt).toContain("Нельзя считать");
  });

  it("returns a local fallback when a price query has no catalog match", () => {
    const context = buildPricingContext("Сколько стоит подключить бассейн?");

    expect(context?.localFallbackReply).toContain("нет однозначной позиции");
  });
});

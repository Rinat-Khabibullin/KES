import { describe, expect, it } from "vitest";
import { calculateEstimate, createEstimateInput } from "./calculate";
import { estimateCategories, estimateServices, getServiceIdByLegacyNumber } from "./catalog";
import { searchPriceCatalog } from "./search";
import { parseEstimateDraft, serializeEstimateDraft } from "./storage";

describe("estimate catalog", () => {
  it("contains the imported XLSX structure", () => {
    expect(estimateServices).toHaveLength(114);
    expect(estimateCategories).toHaveLength(11);

    const numbers = estimateServices.map((service) => service.legacyNumber);
    expect(new Set(numbers).size).toBe(114);
    expect(numbers).toEqual(Array.from({ length: 114 }, (_, index) => index + 1));
    expect(new Set(estimateServices.map((service) => service.id)).size).toBe(114);
  });

  it("has valid public service fields and relations", () => {
    const ids = new Set(estimateServices.map((service) => service.id));

    for (const service of estimateServices) {
      expect(service.name.length).toBeGreaterThan(2);
      expect(service.originalUnit.length).toBeGreaterThan(0);
      expect(service.price.currency).toBe("RUB");
      expect(service.price.value ?? 0).toBeGreaterThanOrEqual(0);

      for (const relationId of [
        ...(service.relation?.requires ?? []),
        ...(service.relation?.suggests ?? []),
        ...(service.relation?.conflictsWith ?? []),
      ]) {
        expect(ids.has(relationId)).toBe(true);
      }
    }
  });

  it("keeps panel and podrozetnik business rules explicit", () => {
    const panelBody = estimateServices.find((service) => service.legacyNumber === 35);
    const breaker = estimateServices.find((service) => service.legacyNumber === 37);
    const podrozetnik = estimateServices.find((service) => service.legacyNumber === 30);

    expect(panelBody?.name).toContain("корпуса");
    expect(panelBody?.needsOwnerReview).toBe(true);
    expect(breaker?.name).toContain("за 1 аппарат");
    expect(podrozetnik?.name).toContain("Установка и фиксация подрозетника в готовое отверстие");
    expect(podrozetnik?.excludes[0]).toContain("Изготовление отверстия");
  });
});

describe("estimate calculation", () => {
  it("calculates required examples from the owner price list", () => {
    expect(calculateEstimate({ items: [createEstimateInput(1, 2)] }).calculableSubtotal).toBe(1400);
    expect(calculateEstimate({ items: [createEstimateInput(15, 3)] }).calculableSubtotal).toBe(1320);
    expect(calculateEstimate({ items: [createEstimateInput(49, 10)] }).calculableSubtotal).toBe(1200);
    expect(calculateEstimate({ items: [createEstimateInput(58, 5)] }).calculableSubtotal).toBe(1500);

    const monolith = calculateEstimate({
      items: [createEstimateInput(58, 10)],
      conditions: { applyMonolithChasing: true },
    });
    expect(monolith.totalMin).toBe(4200);
    expect(monolith.totalMax).toBe(4500);

    const cableInReadyChase = calculateEstimate({
      items: [createEstimateInput(50, 10)],
      conditions: { applyMonolithChasing: true },
    });
    expect(cableInReadyChase.calculableSubtotal).toBe(1500);
    expect(cableInReadyChase.totalMax).toBeUndefined();

    const turnkey = calculateEstimate({ items: [createEstimateInput(94, 60)] });
    expect(turnkey.calculableSubtotal).toBe(114000);
    expect(turnkey.displayTotal).toContain("от 114 000 ₽");
  });

  it("supports mixed estimates and fractional meters", () => {
    const result = calculateEstimate({
      items: [createEstimateInput(1, 1), createEstimateInput(49, 2.5), createEstimateInput(15, 2)],
    });

    expect(result.calculableSubtotal).toBe(1880);
    expect(result.lines).toHaveLength(3);
  });

  it("rejects invalid quantities", () => {
    expect(() => calculateEstimate({ items: [createEstimateInput(1, -1)] })).toThrow();
    expect(() => calculateEstimate({ items: [createEstimateInput(1, 1.5)] })).toThrow();
    expect(() => calculateEstimate({ items: [{ serviceId: "missing", quantity: 1 }] })).toThrow();
  });

  it("warns about package conflicts and manual drilling", () => {
    const packageConflict = calculateEstimate({
      items: [createEstimateInput(94, 60), createEstimateInput(15, 5)],
    });
    expect(packageConflict.warnings.some((warning) => warning.code === "package-conflict")).toBe(true);

    const reinforcedDrilling = calculateEstimate({
      items: [createEstimateInput(73, 1)],
      conditions: { drillingInReinforcedConcrete: true },
    });
    expect(reinforcedDrilling.manualItems).toHaveLength(1);
    expect(reinforcedDrilling.displayTotal).toBe("Работы по согласованию");
  });
});

describe("estimate search and draft", () => {
  it("finds services by aliases and common wording", () => {
    expect(searchPriceCatalog({ query: "сколько стоит установить бра", limit: 1 })[0].service.legacyNumber).toBe(1);
    expect(searchPriceCatalog({ query: "10 одинарных розеток", limit: 1 })[0].service.legacyNumber).toBe(15);
    expect(searchPriceCatalog({ query: "открытая прокладка провода", limit: 1 })[0].service.legacyNumber).toBe(49);
    expect(searchPriceCatalog({ query: "штроба 20×20 в монолите", limit: 1 })[0].service.legacyNumber).toBe(58);
    expect(searchPriceCatalog({ query: "электрика под ключ 60 квадратов", limit: 1 })[0].service.legacyNumber).toBe(94);
  });

  it("serializes and restores localStorage drafts without prices", () => {
    const draft = {
      items: [{ serviceId: getServiceIdByLegacyNumber(1), quantity: 2 }],
      conditions: { applyMonolithChasing: true },
    };

    const restored = parseEstimateDraft(serializeEstimateDraft(draft));
    expect(restored?.items).toEqual(draft.items);
    expect(restored?.conditions?.applyMonolithChasing).toBe(true);
    expect(parseEstimateDraft("{bad json")).toBeNull();
  });
});

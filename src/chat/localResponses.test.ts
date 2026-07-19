import { afterEach, describe, expect, it, vi } from "vitest";
import { chatQuickActions } from "../data/chat";
import { getServiceByLegacyNumber } from "../shared/estimate/catalog";
import { formatPrice } from "../shared/estimate/format";
import { resolveChatQuickAction, resolveLocalCatalogQuestion } from "./localResponses";

describe("local chat responses", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("answers the visit price quick action from the catalog without fetch", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const action = chatQuickActions.find((item) => item.id === "visit-price");
    const diagnostic = getServiceByLegacyNumber(111);
    const emergency = getServiceByLegacyNumber(110);
    const response = action ? resolveChatQuickAction(action) : undefined;

    expect(diagnostic).toBeTruthy();
    expect(emergency).toBeTruthy();
    expect(response?.content).toContain(diagnostic!.name);
    expect(response?.content).toContain(formatPrice(diagnostic!.price));
    expect(response?.content).toContain(formatPrice(emergency!.price));
    expect(response?.actions?.some((item) => item.href?.startsWith("tel:"))).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("answers simple catalog price questions locally", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const response = resolveLocalCatalogQuestion("Сколько стоит установить бра?");
    const service = getServiceByLegacyNumber(1);

    expect(service).toBeTruthy();
    expect(response?.content).toContain(service!.name);
    expect(response?.content).toContain(formatPrice(service!.price));
    expect(response?.actions?.some((item) => item.href === "/#photo-estimate")).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not invent fixed prices for complex wiring replacement", () => {
    expect(resolveLocalCatalogQuestion("Сколько стоит замена проводки в квартире?")).toBeUndefined();
  });
});

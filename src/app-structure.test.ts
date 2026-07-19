import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { landingPriceHighlights, landingPriceLegacyNumbers } from "./data/prices";
import { getServiceByLegacyNumber } from "./shared/estimate/catalog";
import { formatPrice, unitPriceLabels } from "./shared/estimate/format";

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("app structure", () => {
  it("keeps the calculator on a dedicated route", () => {
    const appSource = readSource("./App.tsx");
    const lazyRoutesSource = readSource("./routes/lazyRoutes.ts");
    const pricesSource = readSource("./components/Prices/Prices.tsx");
    const headerSource = readSource("./components/Header/Header.tsx");

    expect(appSource).toContain('path="/calculator"');
    expect(appSource).not.toContain('from "./pages/CalculatorPage/CalculatorPage"');
    expect(lazyRoutesSource).toContain('import("../pages/CalculatorPage/CalculatorPage")');
    expect(lazyRoutesSource).toContain('import("../components/ChatWidget/ChatWidget")');
    expect(lazyRoutesSource).toContain('import("../components/Modal/Modal")');
    expect(pricesSource).toContain('to="/calculator"');
    expect(pricesSource).toContain("loadCalculatorPage");
    expect(pricesSource).not.toContain("EstimateCalculator");
    expect(headerSource).toContain('{ to: "/calculator", label: "Калькулятор" }');
  });

  it("uses one hash navigation component instead of timer based route scrolling", () => {
    const appSource = readSource("./App.tsx");
    const scrollSource = readSource("./components/ScrollToHash/ScrollToHash.tsx");

    expect(appSource).toContain("<ScrollToHash />");
    expect(scrollSource).toContain("scrollIntoView");
    expect(scrollSource).toContain("prefers-reduced-motion");
    expect(scrollSource).toContain('tabindex", "-1"');
  });

  it("routes quick chat actions through the local responder before API sending", () => {
    const useChatSource = readSource("./hooks/useChat.ts");
    const quickResolverIndex = useChatSource.indexOf("resolveChatQuickAction(action)");
    const apiFallbackIndex = useChatSource.indexOf("void send(action.label)");

    expect(quickResolverIndex).toBeGreaterThan(-1);
    expect(apiFallbackIndex).toBeGreaterThan(-1);
    expect(quickResolverIndex).toBeLessThan(apiFallbackIndex);
    expect(useChatSource).toContain('createMessage("assistant", localResponse.content, "local", localResponse.actions)');
  });

  it("uses catalog-backed popular prices on the landing", () => {
    expect(landingPriceLegacyNumbers.length).toBeLessThanOrEqual(6);
    expect(new Set(landingPriceLegacyNumbers).size).toBe(landingPriceLegacyNumbers.length);

    for (const price of landingPriceHighlights) {
      const service = getServiceByLegacyNumber(price.legacyNumber);

      expect(service).toBeTruthy();
      expect(price.name).toBe(service!.name);
      expect(price.priceLabel).toBe(formatPrice(service!.price));
      expect(price.unitLabel).toBe(unitPriceLabels[service!.unit]);
    }
  });

  it("keeps SPA rewrite away from API and static files", () => {
    const vercelConfig = JSON.parse(readSource("../vercel.json")) as {
      rewrites?: Array<{ source: string; destination: string }>;
    };

    expect(vercelConfig.rewrites?.[0].destination).toBe("/index.html");
    expect(vercelConfig.rewrites?.[0].source).toContain("api/");
    expect(vercelConfig.rewrites?.[0].source).toContain("assets/");
    expect(vercelConfig.rewrites?.[0].source).toContain("works/");
    expect(vercelConfig.rewrites?.[0].source).toContain(".*\\..*");
  });

  it("declares immutable cache headers for hashed assets and keeps chat uncached", () => {
    const vercelConfig = JSON.parse(readSource("../vercel.json")) as {
      headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    expect(vercelConfig.headers?.some((rule) => rule.source === "/assets/(.*)" && /immutable/.test(rule.headers[0].value))).toBe(true);
    expect(vercelConfig.headers?.some((rule) => rule.source === "/api/chat" && rule.headers[0].value === "no-store")).toBe(true);
  });
});

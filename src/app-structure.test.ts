import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { landingPriceLegacyNumbers } from "./data/prices";
import { getServiceByLegacyNumber } from "./shared/estimate/catalog";

const readSource = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("app structure", () => {
  it("keeps the calculator on a dedicated route", () => {
    const appSource = readSource("./App.tsx");
    const pricesSource = readSource("./components/Prices/Prices.tsx");
    const headerSource = readSource("./components/Header/Header.tsx");

    expect(appSource).toContain('path="/calculator"');
    expect(pricesSource).toContain('to="/calculator"');
    expect(pricesSource).not.toContain("EstimateCalculator");
    expect(headerSource).toContain('{ to: "/calculator", label: "Калькулятор" }');
  });

  it("uses catalog-backed popular prices on the landing", () => {
    expect(landingPriceLegacyNumbers.length).toBeLessThanOrEqual(6);
    expect(new Set(landingPriceLegacyNumbers).size).toBe(landingPriceLegacyNumbers.length);

    for (const legacyNumber of landingPriceLegacyNumbers) {
      expect(getServiceByLegacyNumber(legacyNumber)).toBeTruthy();
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
});

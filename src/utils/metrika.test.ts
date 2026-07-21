// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getMetrikaCounterId,
  reachGoal,
  resetMetrikaTrackingStateForTests,
  trackCalculatorOpen,
  trackPageHit,
} from "./metrika";

describe("metrika utilities", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    window.ym = undefined;
    resetMetrikaTrackingStateForTests();
  });

  it("ignores empty or invalid counter id", () => {
    const ym = vi.fn();
    window.ym = ym;
    vi.stubEnv("VITE_YM_ID", "");

    expect(getMetrikaCounterId()).toBeNull();
    expect(reachGoal("chat_open")).toBe(false);
    expect(ym).not.toHaveBeenCalled();
  });

  it("sends a reachGoal call with sanitized params", () => {
    const ym = vi.fn();
    window.ym = ym;
    vi.stubEnv("VITE_YM_ID", "110920709");

    expect(
      reachGoal("estimate_discuss", {
        order_price: 4200,
        currency: "RUB",
        items_count: 3,
        empty: undefined,
        broken: Number.NaN,
        nested: { private: true },
      }),
    ).toBe(true);

    expect(ym).toHaveBeenCalledWith(110920709, "reachGoal", "estimate_discuss", {
      order_price: 4200,
      currency: "RUB",
      items_count: 3,
    });
  });

  it("deduplicates repeated page hits and calculator opens", () => {
    const ym = vi.fn();
    window.ym = ym;
    document.title = "Калькулятор";
    vi.stubEnv("VITE_YM_ID", "110920709");

    expect(trackPageHit("https://www.electrik-tuapse.ru/calculator")).toBe(true);
    expect(trackPageHit("https://www.electrik-tuapse.ru/calculator")).toBe(false);
    expect(trackCalculatorOpen("calculator-route-key")).toBe(true);
    expect(trackCalculatorOpen("calculator-route-key")).toBe(false);

    expect(ym).toHaveBeenCalledTimes(2);
    expect(ym).toHaveBeenNthCalledWith(1, 110920709, "hit", "https://www.electrik-tuapse.ru/calculator", {
      title: "Калькулятор",
    });
    expect(ym).toHaveBeenNthCalledWith(2, 110920709, "reachGoal", "calculator_open", undefined);
  });
});

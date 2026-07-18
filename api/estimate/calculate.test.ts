import { describe, expect, it } from "vitest";
import { getServiceIdByLegacyNumber } from "../../src/shared/estimate/catalog.js";
import { handleEstimateCalculateRequest } from "./calculate.js";

describe("estimate calculate API", () => {
  it("recalculates totals on the server from service ids and quantities", async () => {
    const response = await handleEstimateCalculateRequest(
      new Request("http://localhost/api/estimate/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ serviceId: getServiceIdByLegacyNumber(1), quantity: 2 }],
          calculatedResult: { calculableSubtotal: 1 },
        }),
      }),
    );

    expect(response.status).toBe(200);
    const payload = (await response.json()) as { calculableSubtotal: number };
    expect(payload.calculableSubtotal).toBe(1400);
  });
});

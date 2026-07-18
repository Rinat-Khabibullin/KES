import {
  calculateEstimate,
  EstimateCalculationError,
} from "../../src/shared/estimate/calculate.js";
import type { EstimateCalculateRequest } from "../../src/shared/estimate/types.js";
import { checkRateLimit, handleOptions, readJsonBody, sendJson } from "../_estimate/http.js";

export const maxDuration = 10;

export const handleEstimateCalculateRequest = async (request: Request) => {
  if (request.method === "OPTIONS") {
    return handleOptions(request, "POST, OPTIONS");
  }

  if (request.method !== "POST") {
    return sendJson(
      request,
      405,
      {
        error: "Метод не поддерживается.",
        code: "method_not_allowed",
      },
      "POST, OPTIONS",
    );
  }

  if (!checkRateLimit(request, "estimate-calculate", 60)) {
    return sendJson(
      request,
      429,
      {
        error: "Слишком много расчётов подряд. Подождите минуту и попробуйте снова.",
        code: "rate_limited",
      },
      "POST, OPTIONS",
    );
  }

  try {
    const body = (await readJsonBody(request)) as EstimateCalculateRequest;
    const result = calculateEstimate({
      items: body.items,
      conditions: body.conditions,
    });

    return sendJson(request, 200, result, "POST, OPTIONS");
  } catch (error) {
    if (error instanceof EstimateCalculationError) {
      return sendJson(
        request,
        error.statusCode,
        {
          error: error.message,
          code: "bad_request",
        },
        "POST, OPTIONS",
      );
    }

    console.error("[estimate-api]", error instanceof Error ? error.message.slice(0, 240) : "unknown error");

    return sendJson(
      request,
      500,
      {
        error: "Не удалось рассчитать смету.",
        code: "internal_error",
      },
      "POST, OPTIONS",
    );
  }
};

export const POST = handleEstimateCalculateRequest;
export const OPTIONS = handleEstimateCalculateRequest;

export default {
  fetch: handleEstimateCalculateRequest,
};

import { searchPriceCatalog } from "../../src/shared/estimate/search.js";
import { checkRateLimit, handleOptions, sendJson } from "../_estimate/http.js";

export const maxDuration = 10;

export const handlePriceSearchRequest = async (request: Request) => {
  if (request.method === "OPTIONS") {
    return handleOptions(request, "GET, OPTIONS");
  }

  if (request.method !== "GET") {
    return sendJson(
      request,
      405,
      {
        error: "Метод не поддерживается.",
        code: "method_not_allowed",
      },
      "GET, OPTIONS",
    );
  }

  if (!checkRateLimit(request, "prices-search", 90)) {
    return sendJson(
      request,
      429,
      {
        error: "Слишком много запросов к поиску. Подождите минуту и попробуйте снова.",
        code: "rate_limited",
      },
      "GET, OPTIONS",
    );
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const category = url.searchParams.get("category")?.trim() || undefined;
  const limit = Number(url.searchParams.get("limit") ?? 8);

  if (query.length > 160) {
    return sendJson(
      request,
      400,
      {
        error: "Поисковый запрос слишком длинный.",
        code: "bad_request",
      },
      "GET, OPTIONS",
    );
  }

  return sendJson(
    request,
    200,
    {
      query,
      results: searchPriceCatalog({
        query,
        category,
        limit: Number.isFinite(limit) ? limit : 8,
      }),
    },
    "GET, OPTIONS",
  );
};

export const GET = handlePriceSearchRequest;
export const OPTIONS = handlePriceSearchRequest;

export default {
  fetch: handlePriceSearchRequest,
};

import {
  estimateCatalogVersion,
  estimateCategories,
  estimateServices,
} from "../src/shared/estimate/catalog.js";
import { handleOptions, sendJson } from "./_estimate/http.js";

export const maxDuration = 10;

const estimateCatalogSource = "смета_электромонтаж_полная.xlsx";

export const handlePricesRequest = async (request: Request) => {
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

  const response = sendJson(
    request,
    200,
    {
      catalogVersion: estimateCatalogVersion,
      source: estimateCatalogSource,
      categories: estimateCategories,
      services: estimateServices.filter((service) => service.publicVisible),
    },
    "GET, OPTIONS",
  );
  response.headers.set("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800");
  response.headers.set("ETag", `"${estimateCatalogVersion}"`);

  return response;
};

export const GET = handlePricesRequest;
export const OPTIONS = handlePricesRequest;

export default {
  fetch: handlePricesRequest,
};

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

  return sendJson(
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
};

export const GET = handlePricesRequest;
export const OPTIONS = handlePricesRequest;

export default {
  fetch: handlePricesRequest,
};

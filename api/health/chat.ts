import { randomUUID } from "node:crypto";
import {
  createChatHeaders,
  getChatHealth,
  getDeploymentEnvironment,
  isRequestOriginAllowed,
} from "../_chat/runtime.js";

export const maxDuration = 5;
export const runtime = "nodejs";

const sendHealthJson = (request: Request, status: number, body: object, requestId: string) =>
  new Response(JSON.stringify({ ...body, requestId }), {
    status,
    headers: createChatHeaders(request, "GET, OPTIONS", requestId),
  });

export const handleChatHealthRequest = async (request: Request) => {
  const requestId = randomUUID().slice(0, 12);
  const startedAt = Date.now();

  console.info(
    "[chat-health]",
    JSON.stringify({
      requestId,
      deploymentEnvironment: getDeploymentEnvironment(),
      stage: "start",
      origin: request.headers.get("origin") || "same-origin",
    }),
  );

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: createChatHeaders(request, "GET, OPTIONS", requestId),
    });
  }

  if (request.method !== "GET") {
    return sendHealthJson(
      request,
      405,
      {
        ok: false,
        error: "Метод не поддерживается.",
        code: "method_not_allowed",
      },
      requestId,
    );
  }

  if (!isRequestOriginAllowed(request)) {
    return sendHealthJson(
      request,
      403,
      {
        ok: false,
        error: "Этот домен не может запрашивать диагностику чата.",
        code: "cors_forbidden",
      },
      requestId,
    );
  }

  const health = getChatHealth();

  console.info(
    "[chat-health]",
    JSON.stringify({
      requestId,
      deploymentEnvironment: health.deploymentEnvironment,
      stage: "finish",
      status: health.ok ? 200 : 503,
      durationMs: Date.now() - startedAt,
      missing: health.missingRequired,
    }),
  );

  return sendHealthJson(request, health.ok ? 200 : 503, health, requestId);
};

export async function GET(request: Request): Promise<Response> {
  return handleChatHealthRequest(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return handleChatHealthRequest(request);
}

import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from "node:http";
import { askGigaChat } from "./_chat/gigachatClient";
import { guardMessage, normalizeMessage, sanitizeHistory } from "./_chat/guards";
import { buildModelMessages, chatModelConfig } from "./_chat/prompt";
import type { ApiErrorBody, ChatRequestBody, ChatResponseBody } from "./_chat/types";

export const maxDuration = 30;

type ApiRequest = IncomingMessage & {
  body?: unknown;
  headers: IncomingHttpHeaders;
};

const rateLimitBucket = new Map<string, number[]>();

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const getIp = (request: ApiRequest) => {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.socket.remoteAddress || "unknown";
};

const setCors = (request: ApiRequest, response: ServerResponse) => {
  const allowedOrigin = process.env.LLM_CORS_ORIGIN?.trim();
  const origin = request.headers.origin;

  if (allowedOrigin && origin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
  }

  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
};

const sendJson = (response: ServerResponse, statusCode: number, body: ChatResponseBody | ApiErrorBody) => {
  response.writeHead(statusCode, jsonHeaders);
  response.end(JSON.stringify(body));
};

const getSafeErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "Unknown chat error");

const classifyChatError = (
  error: unknown,
): { code: ApiErrorBody["code"]; userMessage: string } => {
  const message = getSafeErrorMessage(error);

  if (message.includes("GIGACHAT_CREDENTIALS")) {
    return {
      code: "service_unavailable",
      userMessage:
        "Чат пока не настроен на сервере. Добавьте переменные GigaChat в Vercel или свяжитесь с нами по телефону.",
    };
  }

  if (message.includes("GigaChat HTTP 401") || message.includes("GigaChat HTTP 403")) {
    return {
      code: "invalid_credentials",
      userMessage:
        "Чат не смог авторизоваться в GigaChat. Проверьте ключ и scope в настройках Vercel.",
    };
  }

  if (message.toLowerCase().includes("timeout")) {
    return {
      code: "upstream_timeout",
      userMessage:
        "GigaChat слишком долго отвечает. Попробуйте еще раз или позвоните нам — консультация бесплатная.",
    };
  }

  if (/certificate|self-signed|unable to verify|tls/i.test(message)) {
    return {
      code: "tls_error",
      userMessage:
        "Сервер не смог установить защищенное соединение с GigaChat. Проверьте GIGACHAT_VERIFY_SSL в Vercel.",
    };
  }

  return {
    code: "upstream_error",
    userMessage:
      "Сейчас не получилось получить ответ от помощника. Можно позвонить нам или открыть Авито — консультация бесплатная.",
  };
};

const logChatError = (stage: string, error: unknown) => {
  console.error("[chat-api]", stage, getSafeErrorMessage(error).slice(0, 300));
};

const readJsonBody = async (request: ApiRequest): Promise<unknown> => {
  if (request.body) {
    return request.body;
  }

  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;

    if (size > 32_000) {
      throw new Error("Request body is too large");
    }

    chunks.push(buffer);
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");
  return rawBody ? JSON.parse(rawBody) : {};
};

const checkRateLimit = (ip: string) => {
  const now = Date.now();
  const windowStart = now - chatModelConfig.rateLimitWindowMs;
  const recentRequests = (rateLimitBucket.get(ip) || []).filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= chatModelConfig.rateLimitMaxRequests) {
    rateLimitBucket.set(ip, recentRequests);
    return false;
  }

  recentRequests.push(now);
  rateLimitBucket.set(ip, recentRequests);
  return true;
};

export default async function handler(request: ApiRequest, response: ServerResponse) {
  try {
    setCors(request, response);

    if (request.method === "OPTIONS") {
      response.writeHead(204);
      response.end();
      return;
    }

    if (request.method !== "POST") {
      sendJson(response, 405, {
        error: "Метод не поддерживается.",
        code: "method_not_allowed",
      });
      return;
    }

    if (!checkRateLimit(getIp(request))) {
      sendJson(response, 429, {
        error: "Слишком много сообщений подряд. Подождите минуту и попробуйте снова.",
        code: "rate_limited",
      });
      return;
    }

    let body: ChatRequestBody;

    try {
      body = (await readJsonBody(request)) as ChatRequestBody;
    } catch {
      sendJson(response, 400, {
        error: "Не удалось прочитать сообщение.",
        code: "bad_request",
      });
      return;
    }

    const message = normalizeMessage(body.message);

    if (!message) {
      sendJson(response, 400, {
        error: "Напишите вопрос по электрике.",
        code: "bad_request",
      });
      return;
    }

    if (message.length > chatModelConfig.maxInputLength) {
      sendJson(response, 413, {
        error: `Сообщение слишком длинное. Сократите его до ${chatModelConfig.maxInputLength} символов.`,
        code: "message_too_long",
      });
      return;
    }

    const guard = guardMessage(message);
    if (!guard.allowed) {
      sendJson(response, 200, {
        reply: guard.reply,
        source: "local",
      });
      return;
    }

    try {
      const history = sanitizeHistory(body.history);
      const reply = await askGigaChat(buildModelMessages(message, history));
      sendJson(response, 200, { reply, source: "gigachat" });
    } catch (error) {
      const details = classifyChatError(error);
      logChatError(details.code, error);

      sendJson(response, 503, {
        error: details.userMessage,
        code: details.code,
      });
    }
  } catch (error) {
    logChatError("internal_error", error);

    if (!response.headersSent) {
      sendJson(response, 500, {
        error: "Внутренняя ошибка чата. Мы уже можем принять заявку по телефону или через Авито.",
        code: "internal_error",
      });
      return;
    }

    response.end();
  }
}

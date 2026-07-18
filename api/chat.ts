import { askGigaChat } from "./_chat/gigachatClient";
import { guardMessage, normalizeMessage, sanitizeHistory } from "./_chat/guards";
import { buildModelMessages, chatModelConfig } from "./_chat/prompt";
import type { ApiErrorBody, ChatRequestBody, ChatResponseBody } from "./_chat/types";

export const maxDuration = 30;

const rateLimitBucket = new Map<string, number[]>();

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const getIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
};

const createHeaders = (request: Request) => {
  const headers = new Headers(jsonHeaders);
  const allowedOrigin = process.env.LLM_CORS_ORIGIN?.trim();
  const origin = request.headers.get("origin");

  if (allowedOrigin && origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return headers;
};

const sendJson = (
  request: Request,
  statusCode: number,
  body: ChatResponseBody | ApiErrorBody,
) =>
  new Response(JSON.stringify(body), {
    status: statusCode,
    headers: createHeaders(request),
  });

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown chat error";

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
        "GigaChat слишком долго отвечает. Попробуйте еще раз или позвоните нам - консультация бесплатная.",
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
      "Сейчас не получилось получить ответ от помощника. Можно позвонить нам или открыть Авито - консультация бесплатная.",
  };
};

const logChatError = (stage: string, error: unknown) => {
  console.error("[chat-api]", stage, getSafeErrorMessage(error).slice(0, 300));
};

const readJsonBody = async (request: Request): Promise<unknown> => {
  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > 32_000) {
    throw new Error("Request body is too large");
  }

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

export const handleChatRequest = async (request: Request) => {
  try {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: createHeaders(request),
      });
    }

    if (request.method !== "POST") {
      return sendJson(request, 405, {
        error: "Метод не поддерживается.",
        code: "method_not_allowed",
      });
    }

    if (!checkRateLimit(getIp(request))) {
      return sendJson(request, 429, {
        error: "Слишком много сообщений подряд. Подождите минуту и попробуйте снова.",
        code: "rate_limited",
      });
    }

    let body: ChatRequestBody;

    try {
      body = (await readJsonBody(request)) as ChatRequestBody;
    } catch {
      return sendJson(request, 400, {
        error: "Не удалось прочитать сообщение.",
        code: "bad_request",
      });
    }

    const message = normalizeMessage(body.message);

    if (!message) {
      return sendJson(request, 400, {
        error: "Напишите вопрос по электрике.",
        code: "bad_request",
      });
    }

    if (message.length > chatModelConfig.maxInputLength) {
      return sendJson(request, 413, {
        error: `Сообщение слишком длинное. Сократите его до ${chatModelConfig.maxInputLength} символов.`,
        code: "message_too_long",
      });
    }

    const guard = guardMessage(message);
    if (!guard.allowed) {
      return sendJson(request, 200, {
        reply: guard.reply,
        source: "local",
      });
    }

    try {
      const history = sanitizeHistory(body.history);
      const reply = await askGigaChat(buildModelMessages(message, history));
      return sendJson(request, 200, { reply, source: "gigachat" });
    } catch (error) {
      const details = classifyChatError(error);
      logChatError(details.code, error);

      return sendJson(request, 503, {
        error: details.userMessage,
        code: details.code,
      });
    }
  } catch (error) {
    logChatError("internal_error", error);

    return sendJson(request, 500, {
      error: "Внутренняя ошибка чата. Мы уже можем принять заявку по телефону или через Авито.",
      code: "internal_error",
    });
  }
};

export const GET = handleChatRequest;
export const POST = handleChatRequest;
export const OPTIONS = handleChatRequest;

export default {
  fetch: handleChatRequest,
};

import { randomUUID } from "node:crypto";
import { askGigaChat, GigaChatHttpError, GigaChatTimeoutError } from "./_chat/gigachatClient.js";
import { guardMessage, normalizeMessage, sanitizeHistory } from "./_chat/guards.js";
import { buildPricingContext } from "./_chat/priceContext.js";
import { buildModelMessages, chatModelConfig } from "./_chat/prompt.js";
import {
  ChatConfigError,
  createChatHeaders,
  getDeploymentEnvironment,
  isRequestOriginAllowed,
  type ChatLogger,
} from "./_chat/runtime.js";
import type { ApiErrorBody, ChatRequestBody, ChatResponseBody } from "./_chat/types.js";

export const maxDuration = 30;
export const runtime = "nodejs";

const rateLimitBucket = new Map<string, number[]>();

const getIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
};

const getSafeErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown chat error";

const createRequestLogger = (requestId: string, request: Request) => {
  const startedAt = Date.now();
  const deploymentEnvironment = getDeploymentEnvironment();

  const log: ChatLogger = (event) => {
    console.info(
      "[chat-api]",
      JSON.stringify({
        requestId,
        deploymentEnvironment,
        ...event,
      }),
    );
  };

  log({
    stage: "start",
    origin: request.headers.get("origin") || "same-origin",
  });

  return {
    log,
    finish(status: number, code?: string, source?: string) {
      log({
        stage: "finish",
        status,
        code,
        source,
        durationMs: Date.now() - startedAt,
      });
    },
  };
};

const classifyChatError = (
  error: unknown,
): { code: ApiErrorBody["code"]; status: number; userMessage: string } => {
  const message = getSafeErrorMessage(error);

  if (error instanceof ChatConfigError) {
    return {
      code: "config_error",
      status: 503,
      userMessage:
        "Чат пока не настроен на сервере. Можно позвонить нам или отправить фото — консультация бесплатная.",
    };
  }

  if (error instanceof GigaChatHttpError) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: "invalid_credentials",
        status: 503,
        userMessage:
          "Чат не смог авторизоваться в GigaChat. Мы уже можем принять вопрос по телефону или через Авито.",
      };
    }

    if (error.statusCode === 429) {
      return {
        code: "upstream_rate_limited",
        status: 503,
        userMessage:
          "Помощник временно перегружен. Попробуйте ещё раз через минуту или позвоните нам — консультация бесплатная.",
      };
    }

    return {
      code: "upstream_error",
      status: error.statusCode >= 500 ? 503 : 502,
      userMessage:
        "Сейчас не получилось получить ответ от помощника. Можно позвонить нам или открыть Авито — консультация бесплатная.",
    };
  }

  if (error instanceof GigaChatTimeoutError || message.toLowerCase().includes("timeout")) {
    return {
      code: "upstream_timeout",
      status: 503,
      userMessage:
        "GigaChat слишком долго отвечает. Попробуйте ещё раз или позвоните нам — консультация бесплатная.",
    };
  }

  if (/certificate|self-signed|unable to verify|tls|UNABLE_TO_VERIFY_LEAF_SIGNATURE|CERT_/i.test(message)) {
    return {
      code: "tls_error",
      status: 503,
      userMessage:
        "Сервер не смог установить защищённое соединение с GigaChat. Вопрос можно решить по телефону или через фото.",
    };
  }

  return {
    code: "upstream_error",
    status: 503,
    userMessage:
      "Сейчас не получилось получить ответ от помощника. Можно позвонить нам или открыть Авито — консультация бесплатная.",
  };
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

const sendJson = (
  request: Request,
  statusCode: number,
  body: ChatResponseBody | ApiErrorBody,
  requestId: string,
) =>
  new Response(JSON.stringify({ ...body, requestId }), {
    status: statusCode,
    headers: createChatHeaders(request, "POST, OPTIONS", requestId),
  });

export const handleChatRequest = async (request: Request) => {
  const requestId = randomUUID().slice(0, 12);
  const logger = createRequestLogger(requestId, request);

  try {
    if (request.method === "OPTIONS") {
      logger.finish(204, "preflight");
      return new Response(null, {
        status: 204,
        headers: createChatHeaders(request, "POST, OPTIONS", requestId),
      });
    }

    if (request.method !== "POST") {
      logger.finish(405, "method_not_allowed");
      return sendJson(
        request,
        405,
        {
          error: "Метод не поддерживается.",
          code: "method_not_allowed",
        },
        requestId,
      );
    }

    if (!isRequestOriginAllowed(request)) {
      logger.log({
        stage: "cors",
        code: "cors_forbidden",
        origin: request.headers.get("origin") || "unknown",
      });
      logger.finish(403, "cors_forbidden");
      return sendJson(
        request,
        403,
        {
          error: "Этот домен не может отправлять запросы в чат.",
          code: "cors_forbidden",
        },
        requestId,
      );
    }

    if (!checkRateLimit(getIp(request))) {
      logger.finish(429, "rate_limited");
      return sendJson(
        request,
        429,
        {
          error: "Слишком много сообщений подряд. Подождите минуту и попробуйте снова.",
          code: "rate_limited",
        },
        requestId,
      );
    }

    let body: ChatRequestBody;

    try {
      body = (await readJsonBody(request)) as ChatRequestBody;
    } catch {
      logger.finish(400, "bad_request");
      return sendJson(
        request,
        400,
        {
          error: "Не удалось прочитать сообщение.",
          code: "bad_request",
        },
        requestId,
      );
    }

    const message = normalizeMessage(body.message);
    logger.log({ stage: "validation", messageLength: message.length });

    if (!message) {
      logger.finish(400, "bad_request");
      return sendJson(
        request,
        400,
        {
          error: "Напишите вопрос по электрике.",
          code: "bad_request",
        },
        requestId,
      );
    }

    if (message.length > chatModelConfig.maxInputLength) {
      logger.finish(413, "message_too_long");
      return sendJson(
        request,
        413,
        {
          error: `Сообщение слишком длинное. Сократите его до ${chatModelConfig.maxInputLength} символов.`,
          code: "message_too_long",
        },
        requestId,
      );
    }

    const guard = guardMessage(message);
    if (!guard.allowed) {
      logger.finish(200, guard.reason, "local");
      return sendJson(request, 200, { reply: guard.reply, source: "local" }, requestId);
    }

    const history = sanitizeHistory(body.history);
    const pricingContext = buildPricingContext(message, body.estimateContext);

    try {
      const reply = await askGigaChat(buildModelMessages(message, history, pricingContext?.prompt), logger.log);
      logger.finish(200, "ok", "gigachat");
      return sendJson(request, 200, { reply, source: "gigachat" }, requestId);
    } catch (error) {
      const details = classifyChatError(error);
      logger.log({
        stage: "error",
        code: details.code,
        missing: error instanceof ChatConfigError ? error.missing : undefined,
      });

      if (pricingContext?.localFallbackReply) {
        logger.finish(200, "local_price_fallback", "local");
        return sendJson(
          request,
          200,
          {
            reply: pricingContext.localFallbackReply,
            source: "local",
          },
          requestId,
        );
      }

      logger.finish(details.status, details.code);
      return sendJson(
        request,
        details.status,
        {
          error: details.userMessage,
          code: details.code,
        },
        requestId,
      );
    }
  } catch (error) {
    logger.log({ stage: "internal_error", code: getSafeErrorMessage(error).slice(0, 120) });
    logger.finish(500, "internal_error");

    return sendJson(
      request,
      500,
      {
        error: "Внутренняя ошибка чата. Мы уже можем принять заявку по телефону или через Авито.",
        code: "internal_error",
      },
      requestId,
    );
  }
};

export async function POST(request: Request): Promise<Response> {
  return handleChatRequest(request);
}

export async function OPTIONS(request: Request): Promise<Response> {
  return handleChatRequest(request);
}

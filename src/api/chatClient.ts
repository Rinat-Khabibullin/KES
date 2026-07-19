import type { ChatApiErrorResponse, ChatApiMessage, ChatApiResponse, ChatEstimateContext } from "../types/chat";

type SendChatMessageParams = {
  message: string;
  history: ChatApiMessage[];
  estimateContext?: ChatEstimateContext;
  signal?: AbortSignal;
};

export class ChatClientError extends Error {
  readonly code?: string;
  readonly status?: number;
  readonly requestId?: string;

  constructor(message: string, options: { code?: string; status?: number; requestId?: string } = {}) {
    super(message);
    this.name = "ChatClientError";
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
  }
}

const withRequestId = (message: string, requestId?: string) =>
  requestId ? `${message} Код ошибки для поиска в логах: ${requestId}.` : message;

const messageByServerError = (response: Response, payload: Partial<ChatApiErrorResponse>) => {
  if (payload.error) {
    return withRequestId(payload.error, payload.requestId);
  }

  switch (payload.code) {
    case "cors_forbidden":
      return "Чат отклонил запрос с этого домена. Можно позвонить нам или открыть оценку по фото.";
    case "config_error":
    case "service_unavailable":
      return withRequestId(
        "Чат сейчас не настроен на сервере. Можно позвонить нам или отправить фото — консультация бесплатная.",
        payload.requestId,
      );
    case "invalid_credentials":
      return withRequestId(
        "Чат не смог авторизоваться в GigaChat. Вопрос можно решить по телефону или через Авито.",
        payload.requestId,
      );
    case "tls_error":
      return withRequestId(
        "Сервер не смог безопасно подключиться к GigaChat. Можно позвонить нам или отправить фото.",
        payload.requestId,
      );
    case "upstream_timeout":
      return "Помощник не успел ответить. Попробуйте ещё раз или позвоните нам — консультация бесплатная.";
    case "upstream_rate_limited":
    case "rate_limited":
      return "Слишком много запросов подряд. Подождите минуту и попробуйте снова.";
    case "internal_error":
      return withRequestId(
        "Внутренняя ошибка чата. Можно позвонить нам или открыть оценку по фото.",
        payload.requestId,
      );
    default:
      if (response.status === 404) {
        return "Endpoint чата не найден. Возможно, Vercel ещё не подтянул последний деплой.";
      }

      if (response.status === 401 || response.status === 403) {
        return "Чат отклонил запрос. Можно позвонить нам или открыть оценку по фото.";
      }

      if (response.status === 500) {
        return withRequestId(
          "На сервере чата произошла ошибка. Можно позвонить нам или открыть оценку по фото.",
          payload.requestId,
        );
      }

      if (response.status === 503) {
        return withRequestId(
          "Помощник временно недоступен. Можно позвонить нам или отправить фото — консультация бесплатная.",
          payload.requestId,
        );
      }

      return withRequestId("Не удалось отправить сообщение. Попробуйте ещё раз.", payload.requestId);
  }
};

export const sendChatMessage = async ({ message, history, estimateContext, signal }: SendChatMessageParams) => {
  let response: Response;

  try {
    response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message, history, estimateContext }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    throw new ChatClientError(
      "Нет соединения с сервером чата. Проверьте интернет или позвоните нам — консультация бесплатная.",
    );
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");
    const isHtml = /<!doctype html|<html/i.test(text);
    throw new ChatClientError(
      response.status === 404
        ? "Endpoint чата не найден. Возможно, Vercel ещё не собрал serverless-функцию."
        : isHtml
          ? "Сервер вернул HTML вместо JSON. Обычно это значит, что запрос ушёл в SPA rewrite, а не в API."
          : "Сервер вернул неожиданный формат ответа. Попробуйте ещё раз.",
      { status: response.status },
    );
  }

  let payload: Partial<ChatApiResponse> & Partial<ChatApiErrorResponse>;

  try {
    payload = (await response.json()) as Partial<ChatApiResponse> & ChatApiErrorResponse;
  } catch {
    throw new ChatClientError("Сервер вернул некорректный JSON. Попробуйте ещё раз.", {
      status: response.status,
    });
  }

  if (!response.ok) {
    throw new ChatClientError(messageByServerError(response, payload), {
      code: payload.code,
      status: response.status,
      requestId: payload.requestId,
    });
  }

  if (!payload.reply || !payload.source) {
    throw new ChatClientError("Помощник не вернул ответ. Попробуйте переформулировать вопрос.");
  }

  return payload as ChatApiResponse;
};

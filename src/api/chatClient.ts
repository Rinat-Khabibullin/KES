import type { ChatApiMessage, ChatApiResponse, ChatEstimateContext } from "../types/chat";

type SendChatMessageParams = {
  message: string;
  history: ChatApiMessage[];
  estimateContext?: ChatEstimateContext;
  signal?: AbortSignal;
};

export class ChatClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChatClientError";
  }
}

export const sendChatMessage = async ({ message, history, estimateContext, signal }: SendChatMessageParams) => {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message, history, estimateContext }),
    signal,
  });

  let payload: Partial<ChatApiResponse> & { error?: string };

  try {
    payload = (await response.json()) as Partial<ChatApiResponse> & { error?: string };
  } catch {
    throw new ChatClientError("Сервер вернул некорректный ответ. Попробуйте еще раз.");
  }

  if (!response.ok) {
    throw new ChatClientError(payload.error || "Не удалось отправить сообщение.");
  }

  if (!payload.reply || !payload.source) {
    throw new ChatClientError("Помощник не вернул ответ. Попробуйте переформулировать вопрос.");
  }

  return payload as ChatApiResponse;
};

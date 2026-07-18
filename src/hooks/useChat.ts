import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatGreeting, chatInputLimit } from "../data/chat";
import { ChatClientError, sendChatMessage } from "../api/chatClient";
import type { ChatApiMessage, ChatEstimateContext, ChatMessage } from "../types/chat";

const storageKey = "elektrika-tuapse-chat-history";
const requestTimeoutMs = 35_000;

const welcomeMessage = (): ChatMessage => ({
  id: "welcome",
  role: "assistant",
  content: chatGreeting,
  createdAt: Date.now(),
  source: "local",
});

const createMessage = (role: ChatMessage["role"], content: string, source?: ChatMessage["source"]): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: Date.now(),
  source,
});

const loadMessages = () => {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return [welcomeMessage()];
    }

    const parsed = JSON.parse(raw) as ChatMessage[];
    const safeMessages = parsed.filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    );

    return safeMessages.length > 0 ? safeMessages : [welcomeMessage()];
  } catch {
    return [welcomeMessage()];
  }
};

export const useChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState("");
  const sendingRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  const compactHistory = useMemo<ChatApiMessage[]>(
    () =>
      messages
        .filter((message) => message.id !== "welcome")
        .map((message) => ({
          role: message.role,
          content: message.content,
        }))
        .slice(-8),
    [messages],
  );

  const clearMessages = useCallback(() => {
    setMessages([welcomeMessage()]);
    setDraft("");
  }, []);

  const send = useCallback(
    async (rawMessage?: string, estimateContext?: ChatEstimateContext) => {
      const message = (rawMessage ?? draft).trim();

      if (!message || sendingRef.current) {
        return;
      }

      if (message.length > chatInputLimit) {
        setMessages((current) => [
          ...current,
          createMessage(
            "assistant",
            `Сообщение слишком длинное. Сократите его до ${chatInputLimit} символов или разбейте на несколько вопросов.`,
            "local",
          ),
        ]);
        return;
      }

      const userMessage = createMessage("user", message);
      sendingRef.current = true;
      setMessages((current) => [...current, userMessage]);
      setDraft("");
      setIsSending(true);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), requestTimeoutMs);

      try {
        const response = await sendChatMessage({
          message,
          history: compactHistory,
          estimateContext,
          signal: controller.signal,
        });
        setMessages((current) => [...current, createMessage("assistant", response.reply, response.source)]);
      } catch (error) {
        const fallback =
          error instanceof ChatClientError
            ? error.message
            : error instanceof DOMException && error.name === "AbortError"
              ? "Помощник не ответил за 35 секунд. Можно попробовать еще раз или позвонить нам — консультация бесплатная."
              : "Не удалось связаться с помощником. Можно позвонить нам или открыть Авито — консультация бесплатная.";

        setMessages((current) => [...current, createMessage("assistant", fallback, "local")]);
      } finally {
        sendingRef.current = false;
        window.clearTimeout(timeoutId);
        setIsSending(false);
      }
    },
    [compactHistory, draft],
  );

  useEffect(() => {
    const handleEstimateChat = (event: Event) => {
      const customEvent = event as CustomEvent<{
        message?: string;
        estimateContext?: ChatEstimateContext;
      }>;

      setIsOpen(true);
      void send(customEvent.detail?.message, customEvent.detail?.estimateContext);
    };

    window.addEventListener("estimate-chat:send", handleEstimateChat);
    return () => window.removeEventListener("estimate-chat:send", handleEstimateChat);
  }, [send]);

  return {
    clearMessages,
    draft,
    isOpen,
    isSending,
    messages,
    send,
    setDraft,
    setIsOpen,
  };
};

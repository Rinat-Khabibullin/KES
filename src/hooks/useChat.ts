import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveChatQuickAction, resolveLocalCatalogQuestion } from "../chat/localResponses";
import { chatGreeting, chatInputLimit, type ChatQuickAction } from "../data/chat";
import { ChatClientError, sendChatMessage } from "../api/chatClient";
import type { ChatApiMessage, ChatEstimateContext, ChatMessage, ChatMessageAction } from "../types/chat";
import { reachGoal } from "../utils/metrika";

const storageKey = "elektrika-tuapse-chat-history";
const requestTimeoutMs = 35_000;

const welcomeMessage = (): ChatMessage => ({
  id: "welcome",
  role: "assistant",
  content: chatGreeting,
  createdAt: Date.now(),
  source: "local",
});

const createMessage = (
  role: ChatMessage["role"],
  content: string,
  source?: ChatMessage["source"],
  actions?: ChatMessageAction[],
): ChatMessage => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  content,
  createdAt: Date.now(),
  source,
  actions,
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
  const [quickActionsVisible, setQuickActionsVisible] = useState(
    () => messages.filter((message) => message.id !== "welcome").length === 0,
  );
  const [lastFailedRequest, setLastFailedRequest] = useState<{
    message: string;
    estimateContext?: ChatEstimateContext;
  } | null>(null);
  const sendingRef = useRef(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(messages.slice(-30)));
  }, [messages]);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      reachGoal("chat_open");
    }

    wasOpenRef.current = isOpen;
    document.body.classList.toggle("is-chat-open", isOpen);
    return () => document.body.classList.remove("is-chat-open");
  }, [isOpen]);

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
    setQuickActionsVisible(true);
    setLastFailedRequest(null);
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
      setQuickActionsVisible(false);

      const localResponse = estimateContext ? undefined : resolveLocalCatalogQuestion(message);
      if (localResponse) {
        setMessages((current) => [
          ...current,
          createMessage("assistant", localResponse.content, "local", localResponse.actions),
        ]);
        sendingRef.current = false;
        setLastFailedRequest(null);
        return;
      }

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
        reachGoal("chat_message_sent");
        setMessages((current) => [...current, createMessage("assistant", response.reply, response.source)]);
        setLastFailedRequest(null);
      } catch (error) {
        const fallback =
          error instanceof ChatClientError
            ? error.message
            : error instanceof DOMException && error.name === "AbortError"
              ? "Помощник не ответил за 35 секунд. Можно попробовать еще раз или позвонить нам — консультация бесплатная."
              : "Не удалось связаться с помощником. Можно позвонить нам или открыть Авито — консультация бесплатная.";

        setMessages((current) => [...current, createMessage("assistant", fallback, "local")]);
        setLastFailedRequest({ message, estimateContext });
      } finally {
        sendingRef.current = false;
        window.clearTimeout(timeoutId);
        setIsSending(false);
      }
    },
    [compactHistory, draft],
  );

  const sendQuickAction = useCallback((action: ChatQuickAction) => {
    const localResponse = resolveChatQuickAction(action);

    setQuickActionsVisible(false);
    setDraft("");

    if (localResponse) {
      setMessages((current) => [
        ...current,
        createMessage("user", action.label),
        createMessage("assistant", localResponse.content, "local", localResponse.actions),
      ]);
      setLastFailedRequest(null);
      return;
    }

    void send(action.label);
  }, [send]);

  const retryLastFailed = useCallback(() => {
    if (!lastFailedRequest) {
      return;
    }

    void send(lastFailedRequest.message, lastFailedRequest.estimateContext);
  }, [lastFailedRequest, send]);

  useEffect(() => {
    const handleChatOpen = () => setIsOpen(true);

    const handleEstimateChat = (event: Event) => {
      const customEvent = event as CustomEvent<{
        message?: string;
        estimateContext?: ChatEstimateContext;
      }>;

      setIsOpen(true);
      void send(customEvent.detail?.message, customEvent.detail?.estimateContext);
    };

    window.addEventListener("chat:open", handleChatOpen);
    window.addEventListener("estimate-chat:send", handleEstimateChat);
    return () => {
      window.removeEventListener("chat:open", handleChatOpen);
      window.removeEventListener("estimate-chat:send", handleEstimateChat);
    };
  }, [send]);

  return {
    clearMessages,
    draft,
    isOpen,
    isSending,
    lastFailedRequest,
    messages,
    quickActionsVisible,
    retryLastFailed,
    send,
    sendQuickAction,
    setDraft,
    setIsOpen,
    setQuickActionsVisible,
  };
};

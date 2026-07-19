import { Bot, HelpCircle, MessageCircle, PhoneCall, RotateCcw, Send, Sparkles, Trash2, X } from "lucide-react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { chatInputLimit, chatQuickActions } from "../../data/chat";
import { phoneHref } from "../../data/site";
import { useChat } from "../../hooks/useChat";

function ChatWidget() {
  const {
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
  } = useChat();
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 120);
    } else if (wasOpenRef.current) {
      window.setTimeout(() => launcherRef.current?.focus(), 80);
    }

    wasOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, setIsOpen]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void send();
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void send();
    }
  };

  return (
    <aside className={`chat-widget ${isOpen ? "chat-widget--open" : ""}`} aria-live="polite">
      <button
        ref={launcherRef}
        className="chat-launcher"
        type="button"
        aria-expanded={isOpen}
        aria-controls="electric-chat"
        onClick={() => setIsOpen(true)}
      >
        <span className="chat-launcher__halo" aria-hidden="true" />
        <span className="chat-launcher__icon" aria-hidden="true">
          <MessageCircle size={25} />
        </span>
        <span>
          <strong>Задать вопрос</strong>
          <small>помощник электрика</small>
        </span>
      </button>

      <section
        className="chat-panel"
        id="electric-chat"
        role="dialog"
        aria-modal="false"
        aria-hidden={!isOpen}
        aria-labelledby="chat-title"
      >
        <header className="chat-panel__header">
          <div className="chat-panel__title">
            <span aria-hidden="true">
              <Bot size={22} />
            </span>
            <div>
              <h2 id="chat-title">Помощник электрика</h2>
              <p>Бесплатная консультация по сайту и услугам</p>
            </div>
          </div>
          <div className="chat-panel__tools">
            <button
              type="button"
              onClick={() => setQuickActionsVisible((current) => !current)}
              aria-label={quickActionsVisible ? "Скрыть подсказки" : "Показать подсказки"}
            >
              <HelpCircle size={18} />
            </button>
            <button type="button" onClick={clearMessages} aria-label="Очистить историю">
              <Trash2 size={18} />
            </button>
            <button type="button" onClick={() => setIsOpen(false)} aria-label="Свернуть чат">
              <X size={19} />
            </button>
          </div>
        </header>

        <div className="chat-panel__intro">
          <Sparkles size={18} />
          <span>Спросите про цены, выезд, щит, розетки, проводку, свет или оценку по фото.</span>
        </div>

        <div className="chat-messages" ref={listRef} role="log" aria-label="История сообщений чата">
          {messages.map((message) => (
            <article className={`chat-message chat-message--${message.role}`} key={message.id}>
              <p>{message.content}</p>
              {message.actions?.length ? (
                <div className="chat-message__actions">
                  {message.actions.map((action) =>
                    action.href?.startsWith("/") ? (
                      <Link key={action.id} to={action.href}>
                        {action.label}
                      </Link>
                    ) : action.href ? (
                      <a key={action.id} href={action.href}>
                        {action.label}
                      </a>
                    ) : null,
                  )}
                </div>
              ) : null}
            </article>
          ))}
          {isSending ? (
            <div className="chat-typing" aria-label="Помощник набирает ответ">
              <span />
              <span />
              <span />
            </div>
          ) : null}
        </div>

        {quickActionsVisible ? (
          <div className="chat-quick" aria-label="Быстрые вопросы">
            <div className="chat-quick__head">
              <strong>Быстрые подсказки</strong>
              <button type="button" onClick={() => setQuickActionsVisible(false)}>
                Скрыть
              </button>
            </div>
            <div className="chat-quick__grid">
              {chatQuickActions.map((action) => (
                <button type="button" key={action.id} disabled={isSending} onClick={() => sendQuickAction(action)}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button type="button" className="chat-hints-button" onClick={() => setQuickActionsVisible(true)}>
            <Sparkles size={16} />
            Подсказки
          </button>
        )}

        {lastFailedRequest ? (
          <button type="button" className="chat-retry" disabled={isSending} onClick={retryLastFailed}>
            <RotateCcw size={16} />
            Повторить последний вопрос
          </button>
        ) : null}

        <form className="chat-form" onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="chat-message">
            Сообщение помощнику электрика
          </label>
          <textarea
            id="chat-message"
            ref={inputRef}
            value={draft}
            maxLength={chatInputLimit}
            rows={2}
            placeholder="Напишите вопрос по электрике..."
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
          />
          <button type="submit" disabled={isSending || draft.trim().length === 0} aria-label="Отправить сообщение">
            <Send size={18} />
          </button>
        </form>

        <a className="chat-panel__call" href={phoneHref}>
          <PhoneCall size={17} />
          Срочно? Позвонить
        </a>
      </section>
    </aside>
  );
}

export default ChatWidget;

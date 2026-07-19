import { MessageCircle } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import { ChatWidget, loadChatWidget } from "../../routes/lazyRoutes";

type EstimateChatDetail = {
  message?: string;
  estimateContext?: unknown;
};

type PendingChatEventProps = {
  detail: EstimateChatDetail | null;
  onDispatched: () => void;
};

const scheduleIdle = (callback: () => void) => {
  const browserWindow = window as Window &
    typeof globalThis & {
      requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

  if (browserWindow.requestIdleCallback && browserWindow.cancelIdleCallback) {
    const idleId = browserWindow.requestIdleCallback(callback, { timeout: 6_000 });
    return () => browserWindow.cancelIdleCallback?.(idleId);
  }

  const timeoutId = window.setTimeout(callback, 3_500);
  return () => window.clearTimeout(timeoutId);
};

function PendingChatEvent({ detail, onDispatched }: PendingChatEventProps) {
  const dispatchedRef = useRef(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (dispatchedRef.current) {
        return;
      }

      dispatchedRef.current = true;
      window.dispatchEvent(
        detail ? new CustomEvent("estimate-chat:send", { detail }) : new CustomEvent("chat:open"),
      );
      onDispatched();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [detail, onDispatched]);

  return null;
}

function ChatMount() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const pendingEstimateRef = useRef<EstimateChatDetail | null>(null);
  const loadedRef = useRef(false);
  const widgetLoadPromiseRef = useRef<ReturnType<typeof loadChatWidget> | null>(null);

  const preload = () => {
    widgetLoadPromiseRef.current ??= loadChatWidget();
    return widgetLoadPromiseRef.current;
  };

  const openChat = () => {
    setPendingOpen(true);
    void preload().then(() => {
      loadedRef.current = true;
      setIsLoaded(true);
    });
  };

  useEffect(() => {
    const cancelIdle = scheduleIdle(() => {
      void preload();
    });

    const handleOpen = () => {
      if (!loadedRef.current) {
        openChat();
      }
    };
    const handleEstimate = (event: Event) => {
      if (loadedRef.current) {
        return;
      }
      pendingEstimateRef.current = (event as CustomEvent<EstimateChatDetail>).detail ?? {};
      openChat();
    };

    window.addEventListener("chat:open", handleOpen);
    window.addEventListener("estimate-chat:send", handleEstimate);

    return () => {
      cancelIdle();
      window.removeEventListener("chat:open", handleOpen);
      window.removeEventListener("estimate-chat:send", handleEstimate);
    };
  }, []);

  if (isLoaded) {
    return (
      <Suspense fallback={null}>
        <ChatWidget />
        {pendingOpen ? (
          <PendingChatEvent
            detail={pendingEstimateRef.current}
            onDispatched={() => {
              pendingEstimateRef.current = null;
              setPendingOpen(false);
            }}
          />
        ) : null}
      </Suspense>
    );
  }

  return (
    <aside className="chat-widget" aria-live="polite">
      <button
        className="chat-launcher"
        type="button"
        aria-controls="electric-chat"
        onClick={openChat}
        onFocus={() => void preload()}
        onPointerEnter={() => void preload()}
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
    </aside>
  );
}

export default ChatMount;

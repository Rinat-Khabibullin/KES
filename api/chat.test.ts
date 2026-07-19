import { afterEach, describe, expect, it, vi } from "vitest";
import { handleChatRequest } from "./chat.js";

const stubChatEnv = (overrides: Partial<Record<string, string>> = {}) => {
  vi.stubEnv("GIGACHAT_CREDENTIALS", overrides.GIGACHAT_CREDENTIALS ?? "");
  vi.stubEnv("GIGACHAT_SCOPE", overrides.GIGACHAT_SCOPE ?? "GIGACHAT_API_PERS");
  vi.stubEnv("GIGACHAT_MODEL", overrides.GIGACHAT_MODEL ?? "GigaChat-2");
  vi.stubEnv("GIGACHAT_TIMEOUT", overrides.GIGACHAT_TIMEOUT ?? "30");
  vi.stubEnv("GIGACHAT_VERIFY_SSL", overrides.GIGACHAT_VERIFY_SSL ?? "false");
  vi.stubEnv(
    "GIGACHAT_AUTH_URL",
    overrides.GIGACHAT_AUTH_URL ?? "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
  );
  vi.stubEnv("GIGACHAT_API_URL", overrides.GIGACHAT_API_URL ?? "https://api.giga.chat/v1/chat/completions");
  vi.stubEnv("LLM_CORS_ORIGINS", overrides.LLM_CORS_ORIGINS ?? "https://www.electrik-tuapse.ru");
};

describe("chat API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("handles OPTIONS preflight without touching GigaChat", async () => {
    const response = await handleChatRequest(
      new Request("http://localhost/api/chat", {
        method: "OPTIONS",
        headers: { Origin: "http://localhost:5173" },
      }),
    );

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("POST");
  });

  it("rejects unknown cross-origin requests", async () => {
    stubChatEnv();

    const response = await handleChatRequest(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { Origin: "https://example.org", "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Сколько стоит розетка в Туапсе?" }),
      }),
    );

    const payload = (await response.json()) as { code: string; requestId?: string };
    expect(response.status).toBe(403);
    expect(payload.code).toBe("cors_forbidden");
    expect(payload.requestId).toBeTruthy();
  });

  it("returns a config error with requestId when credentials are missing", async () => {
    stubChatEnv();

    const response = await handleChatRequest(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Нужно подключить электрику в доме в Туапсе" }),
      }),
    );

    const payload = (await response.json()) as { code: string; requestId?: string };
    expect(response.status).toBe(503);
    expect(payload.code).toBe("config_error");
    expect(payload.requestId).toBeTruthy();
  });

  it("keeps a local price fallback when GigaChat is unavailable", async () => {
    stubChatEnv();

    const response = await handleChatRequest(
      new Request("http://localhost/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Сколько стоит установка бра?" }),
      }),
    );

    const payload = (await response.json()) as { reply: string; source: string };
    expect(response.status).toBe(200);
    expect(payload.source).toBe("local");
    expect(payload.reply).toContain("₽");
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { handleChatHealthRequest } from "./chat.js";

const stubRequiredHealthEnv = (verifySsl = "false") => {
  vi.stubEnv("GIGACHAT_CREDENTIALS", "fake-credentials");
  vi.stubEnv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS");
  vi.stubEnv("GIGACHAT_MODEL", "GigaChat-2");
  vi.stubEnv("GIGACHAT_TIMEOUT", "30");
  vi.stubEnv("GIGACHAT_VERIFY_SSL", verifySsl);
  vi.stubEnv("GIGACHAT_AUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth");
  vi.stubEnv("GIGACHAT_API_URL", "https://api.giga.chat/v1/chat/completions");
  vi.stubEnv("LLM_CORS_ORIGINS", "https://www.electrik-tuapse.ru");
  vi.stubEnv("GIGACHAT_CA_CERT_BASE64", "");
  vi.stubEnv("GIGACHAT_CA_CERT_PATH", "");
};

describe("chat health API", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns safe healthy diagnostics without OAuth", async () => {
    stubRequiredHealthEnv("false");

    const response = await handleChatHealthRequest(new Request("http://localhost/api/health/chat"));
    const payload = (await response.json()) as {
      ok: boolean;
      runtime: string;
      credentialsConfigured: boolean;
      sslVerificationEnabled: boolean;
      catalogVersion: string;
      requestId?: string;
    };

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.runtime).toBe("nodejs");
    expect(payload.credentialsConfigured).toBe(true);
    expect(payload.sslVerificationEnabled).toBe(false);
    expect(payload.catalogVersion).toContain("price");
    expect(payload.requestId).toBeTruthy();
  });

  it("reports missing CA certificate when SSL verification is enabled", async () => {
    stubRequiredHealthEnv("true");

    const response = await handleChatHealthRequest(new Request("http://localhost/api/health/chat"));
    const payload = (await response.json()) as { ok: boolean; missingRequired: string[] };

    expect(response.status).toBe(503);
    expect(payload.ok).toBe(false);
    expect(payload.missingRequired).toContain("GIGACHAT_CA_CERT_PATH or GIGACHAT_CA_CERT_BASE64");
  });
});

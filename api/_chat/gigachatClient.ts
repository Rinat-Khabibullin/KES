import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import https from "node:https";
import { chatModelConfig } from "./prompt";
import type { ModelMessage } from "./types";

type OAuthResponse = {
  access_token?: string;
  expires_at?: number;
};

type GigaChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

type RequestOptions = {
  method: "POST";
  headers: Record<string, string>;
  body: string;
  timeoutMs: number;
  verifySsl: boolean;
  caCertPath?: string;
};

let tokenCache: TokenCache | null = null;

function getEnv(name: string): string | undefined;
function getEnv(name: string, fallback: string): string;
function getEnv(name: string, fallback?: string) {
  const value = process.env[name]?.trim();
  return value || fallback;
}

const parseBooleanEnv = (name: string, fallback: boolean) => {
  const value = getEnv(name);
  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === "true";
};

const parseTimeout = () => {
  const timeout = Number(getEnv("GIGACHAT_TIMEOUT", "30"));
  return Number.isFinite(timeout) && timeout > 0 ? timeout * 1000 : 30_000;
};

const requestJson = <T>(url: string, options: RequestOptions): Promise<T> =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    const timeout = setTimeout(() => {
      request.destroy(new Error("GigaChat request timeout"));
    }, options.timeoutMs);
    const ca = options.caCertPath ? readFileSync(options.caCertPath) : undefined;
    const request = https.request(
      {
        method: options.method,
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port,
        path: `${target.pathname}${target.search}`,
        headers: {
          ...options.headers,
          "Content-Length": Buffer.byteLength(options.body).toString(),
        },
        rejectUnauthorized: options.verifySsl,
        ca,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          clearTimeout(timeout);
          const text = Buffer.concat(chunks).toString("utf8");

          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new Error(`GigaChat HTTP ${response.statusCode ?? 0}: ${text.slice(0, 240)}`));
            return;
          }

          try {
            resolve(JSON.parse(text) as T);
          } catch {
            reject(new Error("GigaChat returned invalid JSON"));
          }
        });
      },
    );

    request.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    request.write(options.body);
    request.end();
  });

const getAccessToken = async () => {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken;
  }

  const credentials = getEnv("GIGACHAT_CREDENTIALS");
  if (!credentials) {
    throw new Error("GIGACHAT_CREDENTIALS is not configured");
  }

  const timeoutMs = parseTimeout();
  const verifySsl = parseBooleanEnv("GIGACHAT_VERIFY_SSL", true);
  const authUrl = getEnv("GIGACHAT_AUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth");
  const scope = getEnv("GIGACHAT_SCOPE", "GIGACHAT_API_PERS");
  const response = await requestJson<OAuthResponse>(authUrl, {
    method: "POST",
    timeoutMs,
    verifySsl,
    caCertPath: getEnv("GIGACHAT_CA_CERT_PATH"),
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      RqUID: randomUUID(),
    },
    body: new URLSearchParams({ scope }).toString(),
  });

  if (!response.access_token) {
    throw new Error("GigaChat OAuth response has no access token");
  }

  tokenCache = {
    accessToken: response.access_token,
    expiresAt: response.expires_at && response.expires_at > now ? response.expires_at : now + 25 * 60_000,
  };

  return tokenCache.accessToken;
};

export const askGigaChat = async (messages: ModelMessage[]) => {
  const accessToken = await getAccessToken();
  const timeoutMs = parseTimeout();
  const verifySsl = parseBooleanEnv("GIGACHAT_VERIFY_SSL", true);
  const apiUrl = getEnv("GIGACHAT_API_URL", "https://api.giga.chat/v1/chat/completions");
  const model = getEnv("GIGACHAT_MODEL", "GigaChat-2");

  const response = await requestJson<GigaChatResponse>(apiUrl, {
    method: "POST",
    timeoutMs,
    verifySsl,
    caCertPath: getEnv("GIGACHAT_CA_CERT_PATH"),
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: chatModelConfig.temperature,
      max_tokens: chatModelConfig.maxTokens,
    }),
  });

  const content = response.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("GigaChat response has no assistant message");
  }

  return content;
};

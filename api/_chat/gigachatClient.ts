import { randomUUID } from "node:crypto";
import https from "node:https";
import { chatModelConfig } from "./prompt.js";
import { getChatRuntimeConfig, type ChatLogger } from "./runtime.js";
import type { ModelMessage } from "./types.js";

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
  caCert?: Buffer;
  stage: "oauth" | "completion";
  log?: ChatLogger;
};

let tokenCache: TokenCache | null = null;

export class GigaChatHttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly stage: string,
    readonly responseSnippet: string,
  ) {
    super(`GigaChat HTTP ${statusCode} during ${stage}`);
    this.name = "GigaChatHttpError";
  }
}

export class GigaChatTimeoutError extends Error {
  constructor(readonly stage: string) {
    super(`GigaChat ${stage} request timeout`);
    this.name = "GigaChatTimeoutError";
  }
}

const requestJson = <T>(url: string, options: RequestOptions): Promise<T> =>
  new Promise((resolve, reject) => {
    const target = new URL(url);
    const startedAt = Date.now();
    const timeout = setTimeout(() => {
      request.destroy(new GigaChatTimeoutError(options.stage));
    }, options.timeoutMs);
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
        ca: options.caCert,
      },
      (response) => {
        const chunks: Buffer[] = [];

        response.on("data", (chunk: Buffer) => chunks.push(chunk));
        response.on("end", () => {
          clearTimeout(timeout);
          const text = Buffer.concat(chunks).toString("utf8");
          options.log?.({
            stage: options.stage,
            status: response.statusCode,
            durationMs: Date.now() - startedAt,
          });

          if (!response.statusCode || response.statusCode < 200 || response.statusCode >= 300) {
            reject(new GigaChatHttpError(response.statusCode ?? 0, options.stage, text.slice(0, 240)));
            return;
          }

          try {
            resolve(JSON.parse(text) as T);
          } catch {
            options.log?.({
              stage: "response_parsing",
              status: response.statusCode,
              code: "invalid_json",
              durationMs: Date.now() - startedAt,
            });
            reject(new Error(`GigaChat returned invalid JSON during ${options.stage}`));
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

const getAccessToken = async (log?: ChatLogger) => {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt - 60_000 > now) {
    return tokenCache.accessToken;
  }

  const config = getChatRuntimeConfig();
  const response = await requestJson<OAuthResponse>(config.authUrl, {
    method: "POST",
    timeoutMs: config.timeoutMs,
    verifySsl: config.verifySsl,
    caCert: config.caCert,
    stage: "oauth",
    log,
    headers: {
      Authorization: `Basic ${config.credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      RqUID: randomUUID(),
    },
    body: new URLSearchParams({ scope: config.scope }).toString(),
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

export const askGigaChat = async (messages: ModelMessage[], log?: ChatLogger) => {
  const accessToken = await getAccessToken(log);
  const config = getChatRuntimeConfig();

  const response = await requestJson<GigaChatResponse>(config.apiUrl, {
    method: "POST",
    timeoutMs: config.timeoutMs,
    verifySsl: config.verifySsl,
    caCert: config.caCert,
    stage: "completion",
    log,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      model: config.model,
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

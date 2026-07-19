import { readFileSync } from "node:fs";
import { estimateCatalogVersion } from "../../src/shared/estimate/catalog.js";

export type ChatLogEvent = {
  stage: string;
  status?: number;
  code?: string;
  durationMs?: number;
  origin?: string;
  messageLength?: number;
  source?: string;
  missing?: string[];
};

export type ChatLogger = (event: ChatLogEvent) => void;

export type ChatRuntimeConfig = {
  credentials: string;
  scope: string;
  model: string;
  timeoutMs: number;
  verifySsl: boolean;
  authUrl: string;
  apiUrl: string;
  caCert?: Buffer;
};

export class ChatConfigError extends Error {
  readonly code = "config_error";
  readonly missing: string[];

  constructor(message: string, missing: string[] = []) {
    super(message);
    this.name = "ChatConfigError";
    this.missing = missing;
  }
}

const productionOrigins = ["https://electrik-tuapse.ru", "https://www.electrik-tuapse.ru"];
const developmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
];

const requiredEnvNames = [
  "GIGACHAT_CREDENTIALS",
  "GIGACHAT_SCOPE",
  "GIGACHAT_MODEL",
  "GIGACHAT_TIMEOUT",
  "GIGACHAT_VERIFY_SSL",
  "GIGACHAT_AUTH_URL",
  "GIGACHAT_API_URL",
] as const;

const envValue = (name: string) => process.env[name]?.trim() || "";

export const getDeploymentEnvironment = () =>
  envValue("VERCEL_ENV") || envValue("NODE_ENV") || "development";

const splitOrigins = (value: string) =>
  value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

export const getAllowedOrigins = () => {
  const origins = new Set<string>(productionOrigins);
  const environment = getDeploymentEnvironment();
  const singleOrigin = envValue("LLM_CORS_ORIGIN");
  const multipleOrigins = envValue("LLM_CORS_ORIGINS");
  const vercelUrl = envValue("VERCEL_URL");

  if (environment !== "production") {
    developmentOrigins.forEach((origin) => origins.add(origin));
  }

  if (singleOrigin) {
    origins.add(singleOrigin);
  }

  splitOrigins(multipleOrigins).forEach((origin) => origins.add(origin));

  if (vercelUrl) {
    origins.add(vercelUrl.startsWith("http") ? vercelUrl : `https://${vercelUrl}`);
  }

  return origins;
};

const getRequestOrigin = (request: Request) => {
  try {
    return new URL(request.url).origin;
  } catch {
    return "";
  }
};

export const isRequestOriginAllowed = (request: Request) => {
  const origin = request.headers.get("origin");
  return !origin || origin === getRequestOrigin(request) || getAllowedOrigins().has(origin);
};

export const createChatHeaders = (request: Request, methods = "POST, OPTIONS", requestId?: string) => {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type",
  });
  const origin = request.headers.get("origin");

  if (origin && (origin === getRequestOrigin(request) || getAllowedOrigins().has(origin))) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
  }

  if (requestId) {
    headers.set("X-Request-Id", requestId);
  }

  return headers;
};

const parseRequiredEnv = () => {
  const missing = requiredEnvNames.filter((name) => !envValue(name));

  if (missing.length > 0) {
    throw new ChatConfigError("Required GigaChat environment variables are missing", missing);
  }
};

const parseBoolean = (name: string) => {
  const value = envValue(name).toLowerCase();

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new ChatConfigError(`${name} must be true or false`, [name]);
};

const parseTimeoutMs = () => {
  const value = Number(envValue("GIGACHAT_TIMEOUT"));

  if (!Number.isFinite(value) || value <= 0 || value > 120) {
    throw new ChatConfigError("GIGACHAT_TIMEOUT must be a number from 1 to 120 seconds", [
      "GIGACHAT_TIMEOUT",
    ]);
  }

  return value * 1000;
};

const readCertificate = () => {
  const caCertBase64 = envValue("GIGACHAT_CA_CERT_BASE64");
  const caCertPath = envValue("GIGACHAT_CA_CERT_PATH");

  if (caCertBase64) {
    const decoded = Buffer.from(caCertBase64, "base64");
    if (decoded.length === 0) {
      throw new ChatConfigError("GIGACHAT_CA_CERT_BASE64 is empty after decoding", [
        "GIGACHAT_CA_CERT_BASE64",
      ]);
    }

    return decoded;
  }

  if (caCertPath) {
    try {
      return readFileSync(caCertPath);
    } catch {
      throw new ChatConfigError("Unable to read GigaChat CA certificate file", ["GIGACHAT_CA_CERT_PATH"]);
    }
  }

  return undefined;
};

export const getChatRuntimeConfig = (): ChatRuntimeConfig => {
  parseRequiredEnv();

  const verifySsl = parseBoolean("GIGACHAT_VERIFY_SSL");
  const caCert = readCertificate();

  if (verifySsl && !caCert) {
    throw new ChatConfigError(
      "GigaChat SSL verification is enabled, but no CA certificate is configured",
      ["GIGACHAT_CA_CERT_PATH or GIGACHAT_CA_CERT_BASE64"],
    );
  }

  return {
    credentials: envValue("GIGACHAT_CREDENTIALS"),
    scope: envValue("GIGACHAT_SCOPE"),
    model: envValue("GIGACHAT_MODEL"),
    timeoutMs: parseTimeoutMs(),
    verifySsl,
    authUrl: envValue("GIGACHAT_AUTH_URL"),
    apiUrl: envValue("GIGACHAT_API_URL"),
    caCert,
  };
};

export const getChatHealth = () => {
  const missingRequired = requiredEnvNames.filter((name) => !envValue(name));
  const verifyRaw = envValue("GIGACHAT_VERIFY_SSL").toLowerCase();
  const sslVerificationEnabled = verifyRaw ? verifyRaw !== "false" : true;
  const certificateConfigured = Boolean(envValue("GIGACHAT_CA_CERT_PATH") || envValue("GIGACHAT_CA_CERT_BASE64"));
  const initialMissing =
    sslVerificationEnabled && !certificateConfigured
      ? [...missingRequired, "GIGACHAT_CA_CERT_PATH or GIGACHAT_CA_CERT_BASE64"]
      : missingRequired;
  let missing = initialMissing;

  try {
    getChatRuntimeConfig();
    missing = [];
  } catch (error) {
    missing = error instanceof ChatConfigError ? error.missing : ["GIGACHAT_RUNTIME_CONFIG"];
  }

  return {
    ok: missing.length === 0,
    runtime: "nodejs",
    credentialsConfigured: Boolean(envValue("GIGACHAT_CREDENTIALS")),
    certificateConfigured,
    sslVerificationEnabled,
    catalogVersion: estimateCatalogVersion,
    deploymentEnvironment: getDeploymentEnvironment(),
    allowedOriginsConfigured: getAllowedOrigins().size,
    missingRequired: missing,
  };
};

export type ApiErrorCode =
  | "bad_request"
  | "method_not_allowed"
  | "rate_limited"
  | "internal_error";

type ApiErrorBody = {
  error: string;
  code: ApiErrorCode;
};

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store",
};

const buckets = new Map<string, number[]>();

export const getIp = (request: Request) => {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") || "unknown";
};

export const createHeaders = (request: Request, methods = "GET, POST, OPTIONS") => {
  const headers = new Headers(jsonHeaders);
  const allowedOrigin = process.env.LLM_CORS_ORIGIN?.trim();
  const origin = request.headers.get("origin");

  if (allowedOrigin && origin === allowedOrigin) {
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Vary", "Origin");
  }

  headers.set("Access-Control-Allow-Methods", methods);
  headers.set("Access-Control-Allow-Headers", "Content-Type");

  return headers;
};

export const sendJson = <TBody>(
  request: Request,
  statusCode: number,
  body: TBody | ApiErrorBody,
  methods?: string,
) =>
  new Response(JSON.stringify(body), {
    status: statusCode,
    headers: createHeaders(request, methods),
  });

export const readJsonBody = async (request: Request, maxBytes = 64_000) => {
  const rawBody = await request.text();

  if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
    throw new Error("Request body is too large");
  }

  return rawBody ? JSON.parse(rawBody) : {};
};

export const checkRateLimit = (request: Request, key: string, maxRequests = 45, windowMs = 60_000) => {
  const now = Date.now();
  const bucketKey = `${key}:${getIp(request)}`;
  const windowStart = now - windowMs;
  const recentRequests = (buckets.get(bucketKey) || []).filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= maxRequests) {
    buckets.set(bucketKey, recentRequests);
    return false;
  }

  recentRequests.push(now);
  buckets.set(bucketKey, recentRequests);
  return true;
};

export const handleOptions = (request: Request, methods?: string) =>
  new Response(null, {
    status: 204,
    headers: createHeaders(request, methods),
  });

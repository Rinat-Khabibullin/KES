import type { EstimateConditions, EstimateLineInput, EstimateResult } from "../../src/shared/estimate/types.js";

export type ChatRole = "user" | "assistant";

export type ClientChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatRequestBody = {
  message: string;
  history?: ClientChatMessage[];
  estimateContext?: {
    catalogVersion: string;
    lines: EstimateLineInput[];
    conditions?: EstimateConditions;
    calculatedResult?: EstimateResult;
  };
};

export type ChatResponseBody = {
  reply: string;
  source: "gigachat" | "local";
  requestId?: string;
};

export type ApiErrorBody = {
  error: string;
  code:
    | "bad_request"
    | "config_error"
    | "cors_forbidden"
    | "method_not_allowed"
    | "message_too_long"
    | "rate_limited"
    | "service_unavailable"
    | "invalid_credentials"
    | "upstream_timeout"
    | "upstream_rate_limited"
    | "tls_error"
    | "internal_error"
    | "upstream_error";
  requestId?: string;
};

export type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatGuardResult =
  | { allowed: true }
  | { allowed: false; reply: string; reason: "off_topic" | "danger" };

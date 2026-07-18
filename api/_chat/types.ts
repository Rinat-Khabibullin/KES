export type ChatRole = "user" | "assistant";

export type ClientChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatRequestBody = {
  message: string;
  history?: ClientChatMessage[];
};

export type ChatResponseBody = {
  reply: string;
  source: "gigachat" | "local";
};

export type ApiErrorBody = {
  error: string;
  code:
    | "bad_request"
    | "method_not_allowed"
    | "message_too_long"
    | "rate_limited"
    | "service_unavailable"
    | "upstream_error";
};

export type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatGuardResult =
  | { allowed: true }
  | { allowed: false; reply: string; reason: "off_topic" | "danger" };

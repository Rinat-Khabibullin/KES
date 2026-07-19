import type { EstimateConditions, EstimateLineInput, EstimateResult } from "../shared/estimate/types";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  source?: "gigachat" | "local";
  actions?: ChatMessageAction[];
};

export type ChatMessageAction = {
  id: string;
  label: string;
  href?: string;
  eventName?: "chat:open";
};

export type ChatApiMessage = {
  role: ChatRole;
  content: string;
};

export type ChatEstimateContext = {
  catalogVersion: string;
  lines: EstimateLineInput[];
  conditions?: EstimateConditions;
  calculatedResult?: EstimateResult;
};

export type ChatApiResponse = {
  reply: string;
  source: "gigachat" | "local";
  requestId?: string;
};

export type ChatApiErrorResponse = {
  error: string;
  code?: string;
  requestId?: string;
};

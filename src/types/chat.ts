export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  source?: "gigachat" | "local";
};

export type ChatApiMessage = {
  role: ChatRole;
  content: string;
};

export type ChatApiResponse = {
  reply: string;
  source: "gigachat" | "local";
};

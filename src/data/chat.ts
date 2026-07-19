export const chatGreeting =
  "Здравствуйте. Я помогу быстро сориентироваться по электрике: цены, выезд, щиты, розетки, освещение, теплый пол, аварийные ситуации и оценка по фото.";

export type ChatQuickActionIntent =
  | "local-answer"
  | "open-calculator"
  | "open-photo-estimate"
  | "call"
  | "llm";

export type ChatQuickAction = {
  id: string;
  label: string;
  intent: ChatQuickActionIntent;
  serviceLegacyNumbers?: number[];
};

export const chatQuickActions: ChatQuickAction[] = [
  {
    id: "visit-price",
    label: "Сколько стоит вызов электрика?",
    intent: "local-answer",
    serviceLegacyNumbers: [111, 110],
  },
  {
    id: "today-visit",
    label: "Можно ли вызвать мастера сегодня?",
    intent: "local-answer",
  },
  {
    id: "wiring-price",
    label: "Сколько стоит замена проводки?",
    intent: "open-calculator",
    serviceLegacyNumbers: [94],
  },
  {
    id: "areas",
    label: "Работаете ли вы за пределами Туапсе?",
    intent: "local-answer",
  },
  {
    id: "estimate",
    label: "Как получить предварительный расчёт?",
    intent: "open-photo-estimate",
  },
];

export const chatInputLimit = 900;

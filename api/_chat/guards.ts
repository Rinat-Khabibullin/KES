import { chatModelConfig } from "./prompt";
import type { ChatGuardResult, ClientChatMessage } from "./types";

const offTopicKeywords = [
  "биткоин",
  "крипт",
  "ставк",
  "казино",
  "политик",
  "выбор",
  "реферат",
  "диплом",
  "код на python",
  "react",
  "javascript",
  "typescript",
  "sql",
  "врач",
  "лекарств",
  "диагноз",
];

const onTopicKeywords = [
  "элект",
  "розет",
  "провод",
  "кабел",
  "щит",
  "автомат",
  "узо",
  "диф",
  "реле",
  "свет",
  "люстр",
  "подсвет",
  "теплый пол",
  "тёплый пол",
  "бойлер",
  "вароч",
  "духов",
  "кондиционер",
  "автомой",
  "ремонт",
  "выезд",
  "стоим",
  "цена",
  "сколько",
  "договор",
  "гарант",
  "фото",
  "авито",
  "туапсе",
  "агой",
  "небуг",
  "ольгинка",
  "новомихайловский",
  "плиточ",
  "потолоч",
  "сантех",
  "отделоч",
];

const dangerKeywords = [
  "дым",
  "горит",
  "пожар",
  "искрит",
  "запах гари",
  "пахнет проводкой",
  "нагревается провод",
  "бьет током",
  "бьёт током",
  "вода в розетке",
  "короткое замыкание",
  "замкнуло",
];

const diyDangerPatterns = [
  "сам подключ",
  "сам заменить автомат",
  "под напряжением",
  "не отключая",
  "как скрутить",
  "как замкнуть",
  "какой провод куда",
];

export const normalizeMessage = (message: unknown): string => {
  if (typeof message !== "string") {
    return "";
  }

  return message.replace(/\s+/g, " ").trim();
};

export const sanitizeHistory = (history: unknown): ClientChatMessage[] => {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((item): item is ClientChatMessage => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const candidate = item as Partial<ClientChatMessage>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string"
      );
    })
    .map((item) => ({
      role: item.role,
      content: normalizeMessage(item.content).slice(0, chatModelConfig.maxHistoryMessageLength),
    }))
    .filter((item) => item.content.length > 0)
    .slice(-chatModelConfig.maxHistoryMessages);
};

export const guardMessage = (message: string): ChatGuardResult => {
  const normalized = message.toLowerCase();

  if (dangerKeywords.some((keyword) => normalized.includes(keyword))) {
    return {
      allowed: false,
      reason: "danger",
      reply:
        "Похоже на потенциально опасную ситуацию с электрикой. По возможности отключите питание на щите, не трогайте розетки, провода и оборудование руками. После этого лучше позвонить нам: консультация бесплатная, подскажем дальнейшие действия и согласуем выезд.",
    };
  }

  if (diyDangerPatterns.some((keyword) => normalized.includes(keyword))) {
    return {
      allowed: false,
      reason: "danger",
      reply:
        "Я не буду подсказывать, как самостоятельно работать с проводкой под напряжением или собирать опасные соединения. Это лучше доверить электрику. Можем бесплатно сориентировать по фото и подсказать безопасный порядок действий без самостоятельного вмешательства.",
    };
  }

  const hasOnTopic = onTopicKeywords.some((keyword) => normalized.includes(keyword));
  const hasOffTopic = offTopicKeywords.some((keyword) => normalized.includes(keyword));

  if (hasOffTopic && !hasOnTopic) {
    return {
      allowed: false,
      reason: "off_topic",
      reply:
        "Я отвечаю только по электромонтажу и услугам электрика в Туапсе и районе: щиты, проводка, розетки, освещение, теплый пол, аварийный ремонт, цены и выезд. Можете описать задачу по электрике своими словами.",
    };
  }

  return { allowed: true };
};

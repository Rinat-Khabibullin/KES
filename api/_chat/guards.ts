import { chatModelConfig } from "./prompt.js";
import type { ChatGuardResult, ClientChatMessage } from "./types.js";

const offTopicKeywords = [
  "биткоин",
  "крипт",
  "ставк",
  "казино",
  "политик",
  "выбор",
  "реферат",
  "диплом",
  "сочинение",
  "код на python",
  "react",
  "javascript",
  "typescript",
  "sql",
  "лендинг",
  "разработк",
  "программ",
  "верстк",
  "веб",
  "seo",
  "врач",
  "лекарств",
  "диагноз",
  "рецепт",
  "плов",
  "борщ",
  "ужин",
  "обед",
  "еда",
  "готов",
  "спорт",
  "футбол",
  "погода",
  "новост",
  "переведи",
  "английск",
];

const serviceKeywords = [
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
  "авто мой",
  "мойк",
  "кафе",
  "общепит",
  "офис",
  "квартира",
  "дом",
  "коттедж",
  "гостиниц",
  "отель",
  "магазин",
  "витрин",
  "помещен",
  "объект",
  "коммерц",
  "неисправ",
  "замык",
  "искр",
  "выбивает",
  "пропал свет",
  "нет света",
  "пахнет",
  "авар",
  "диагност",
  "монтаж",
  "демонтаж",
  "перенос",
  "установка",
  "замена",
  "подключ",
  "проклад",
  "штроб",
  "гофр",
  "трасс",
  "линия",
  "нагрузк",
  "мощност",
  "заземл",
  "ноль",
  "фаза",
  "ввод",
  "счетчик",
  "счётчик",
  "автоматик",
  "защит",
  "слаботоч",
  "кабель канал",
  "распред",
  "коробк",
  "клемм",
  "светильник",
  "трек",
  "бра",
  "спот",
  "led",
  "лед",
  "лента",
  "подсветк",
  "фасад",
  "улич",
  "наруж",
  "внутрен",
  "теплый пол",
  "теплого пола",
  "тёплый пол",
  "тёплого пола",
];

const businessKeywords = [
  "выезд",
  "вызов",
  "стоим",
  "цена",
  "прайс",
  "сколько",
  "смет",
  "расчет",
  "расчёт",
  "оцен",
  "бесплатн",
  "консультац",
  "минимальн",
  "заказ",
  "договор",
  "гарант",
  "оплат",
  "предоплат",
  "акт",
  "материал",
  "закуп",
  "срок",
  "когда",
  "сегодня",
  "завтра",
  "сроч",
  "вечер",
  "выходн",
  "ежеднев",
  "мастер",
  "бригада",
  "команда",
  "специалист",
  "телефон",
  "номер",
  "контакт",
  "позвон",
  "звон",
  "связ",
  "фото",
  "фотограф",
  "снимок",
  "картинк",
  "прислать",
  "отправ",
  "авито",
];

const areaKeywords = [
  "туапсе",
  "агой",
  "небуг",
  "ольгинка",
  "новомихайловский",
  "джубга",
  "лермонтово",
  "псебе",
  "шепси",
  "сочи",
  "краснодарский край",
  "район",
  "посел",
  "посёл",
  "село",
  "адрес",
  "объект",
  "выезд",
];

const partnerKeywords = [
  "плиточ",
  "потолоч",
  "сантех",
  "отделоч",
  "ремонтник",
  "прораб",
  "дизайнер",
  "строител",
  "мебельщик",
  "оконщик",
  "двер",
  "кровельщик",
  "маляр",
  "штукатур",
  "реклам",
  "партнер",
  "партнёр",
  "сотруднич",
  "заявк",
  "лид",
  "рекомендац",
  "рекоменду",
  "заказчик",
  "клиент",
  "обмен",
];

const onTopicKeywords = [
  ...serviceKeywords,
  ...businessKeywords,
  ...areaKeywords,
  ...partnerKeywords,
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
  const normalized = message.toLowerCase().replace(/ё/g, "е");

  if (dangerKeywords.some((keyword) => normalized.includes(keyword.replace(/ё/g, "е")))) {
    return {
      allowed: false,
      reason: "danger",
      reply:
        "Похоже на потенциально опасную ситуацию с электрикой. По возможности отключите питание на щите, не трогайте розетки, провода и оборудование руками. После этого лучше позвонить нам: консультация бесплатная, подскажем дальнейшие действия и согласуем выезд.",
    };
  }

  if (diyDangerPatterns.some((keyword) => normalized.includes(keyword.replace(/ё/g, "е")))) {
    return {
      allowed: false,
      reason: "danger",
      reply:
        "Я не буду подсказывать, как самостоятельно работать с проводкой под напряжением или собирать опасные соединения. Это лучше доверить электрику. Можем бесплатно сориентировать по фото и подсказать безопасный порядок действий без самостоятельного вмешательства.",
    };
  }

  const hasOnTopic = onTopicKeywords.some((keyword) => normalized.includes(keyword.replace(/ё/g, "е")));
  const hasOffTopic = offTopicKeywords.some((keyword) => normalized.includes(keyword.replace(/ё/g, "е")));

  if (!hasOnTopic || hasOffTopic) {
    return {
      allowed: false,
      reason: "off_topic",
      reply:
        "Я отвечаю только по электромонтажу и услугам электрика в Туапсе и районе: щиты, проводка, розетки, освещение, теплый пол, аварийный ремонт, цены, выезд, оценка по фото и сотрудничество с ремонтными специалистами. Опишите задачу по электрике или напишите, с кем хотите обсудить партнерство.",
    };
  }

  return { allowed: true };
};

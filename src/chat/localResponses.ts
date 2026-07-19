import { areas } from "../data/areas";
import type { ChatQuickAction } from "../data/chat";
import { phoneHref } from "../data/site";
import { getServiceByLegacyNumber } from "../shared/estimate/catalog";
import { formatPrice, unitPriceLabels } from "../shared/estimate/format";
import { normalizeSearchText, searchPriceCatalog } from "../shared/estimate/search";
import type { ChatMessageAction } from "../types/chat";

export type LocalChatResponse = {
  content: string;
  actions?: ChatMessageAction[];
};

const phoneAction: ChatMessageAction = {
  id: "call",
  label: "Позвонить",
  href: phoneHref,
};

const photoAction: ChatMessageAction = {
  id: "photo",
  label: "Оценка по фото",
  href: "/#photo-estimate",
};

const calculatorAction: ChatMessageAction = {
  id: "calculator",
  label: "Открыть калькулятор",
  href: "/calculator",
};

const formatServicePrice = (legacyNumber: number) => {
  const service = getServiceByLegacyNumber(legacyNumber);

  if (!service) {
    return undefined;
  }

  return `${service.name}: ${formatPrice(service.price)} ${unitPriceLabels[service.unit]}`;
};

export const resolveChatQuickAction = (action: ChatQuickAction): LocalChatResponse | undefined => {
  switch (action.id) {
    case "visit-price": {
      const diagnostic = formatServicePrice(action.serviceLegacyNumbers?.[0] ?? 111);
      const emergency = formatServicePrice(action.serviceLegacyNumbers?.[1] ?? 110);

      return {
        content: [
          diagnostic ? `Ориентир по выезду: ${diagnostic}.` : "",
          emergency ? `Срочный аварийный выезд считается отдельно: ${emergency}.` : "",
          "Дополнительные работы после диагностики считаются по фактическому объёму. Если ситуация срочная, лучше позвонить — так быстрее понять загрузку и возможность выезда.",
        ]
          .filter(Boolean)
          .join("\n"),
        actions: [phoneAction],
      };
    }

    case "today-visit":
      return {
        content:
          "Возможность выезда сегодня зависит от текущей загрузки и адреса объекта. Для срочной ситуации лучше позвонить: по телефону быстрее уточним проблему, район и безопасный порядок действий. Также можно отправить фото щита или места работ.",
        actions: [phoneAction, photoAction],
      };

    case "wiring-price": {
      const packagePrice = formatServicePrice(action.serviceLegacyNumbers?.[0] ?? 94);

      return {
        content: [
          "Замена проводки не считается одной фиксированной ценой: влияет площадь, материал стен, количество линий и точек, состав щита, штробление и доступ к трассам.",
          packagePrice ? `В каталоге есть ориентир для комплексных работ: ${packagePrice}. Это не финальная стоимость и материалы не включены.` : "",
          "Для честного предварительного расчёта откройте калькулятор или отправьте фото и описание задачи.",
        ]
          .filter(Boolean)
          .join("\n"),
        actions: [calculatorAction, photoAction],
      };
    }

    case "areas":
      return {
        content: `Работаем по этим направлениям: ${areas.join(", ")}. Для удалённых объектов стоимость выезда и минимальная сумма заказа согласуются заранее.`,
        actions: [phoneAction],
      };

    case "estimate":
      return {
        content:
          "Есть два быстрых варианта: открыть калькулятор и собрать предварительную смету по позициям прайса или отправить фотографии щита, розетки, трассы и коротко описать задачу. По фото обычно проще быстрее назвать ориентир.",
        actions: [calculatorAction, photoAction],
      };

    default:
      return undefined;
  }
};

export const resolveLocalCatalogQuestion = (message: string): LocalChatResponse | undefined => {
  const normalized = normalizeSearchText(message);
  const hasPriceIntent = /сколько|стоит|стоим|цена|прайс|руб|₽/u.test(normalized);

  if (!hasPriceIntent) {
    return undefined;
  }

  const matches = searchPriceCatalog({ query: message, limit: 3 });
  const top = matches[0];

  if (!top || top.score < 60) {
    return undefined;
  }

  if (/(^|\s)(новая|новую|новый|новое|новые|новых|с нуля|вывести|добавить|замена проводк)/u.test(normalized)) {
    return undefined;
  }

  const service = top.service;

  return {
    content: `${service.name}: ${formatPrice(service.price)} ${unitPriceLabels[service.unit]}. Материалы не включены, итог зависит от доступа и фактического состава работ. Для точной оценки можно отправить фото.`,
    actions: [photoAction, phoneAction],
  };
};

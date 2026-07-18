import {
  calculateEstimate,
  EstimateCalculationError,
} from "../../src/shared/estimate/calculate.js";
import { estimateCatalogVersion } from "../../src/shared/estimate/catalog.js";
import { formatQuantity, unitLabels } from "../../src/shared/estimate/format.js";
import { searchPriceCatalog, normalizeSearchText } from "../../src/shared/estimate/search.js";
import { estimateResultToText } from "../../src/shared/estimate/summary.js";
import type { ChatRequestBody } from "./types.js";
import type { EstimateCalculateRequest, EstimateLineInput, EstimateResult, EstimateService } from "../../src/shared/estimate/types.js";

export type ChatPricingContext = {
  prompt: string;
  localFallbackReply?: string;
};

const priceIntentPattern = /стоим|цен|прайс|сколько|смет|рассч|расчет|расчёт|обойд|руб|₽|дешев|дорог|итог/u;

const extractNumber = (message: string) => {
  const match = normalizeSearchText(message).match(/(\d+(?:[,.]\d+)?)/u);
  return match ? Number(match[1].replace(",", ".")) : undefined;
};

const shouldCalculateOneUnit = (message: string) =>
  /сколько|стоим|цен|прайс|от чего начинается|за что/u.test(normalizeSearchText(message));

const isAmbiguousNewPoint = (message: string) => {
  const normalized = normalizeSearchText(message);
  return (
    /(нов|с нуля|сделать|вывести|добавить)/u.test(normalized) &&
    /(розет|выключател|электроточ|точк)/u.test(normalized) &&
    !/(готов|уже есть отверст|подрозетник стоит)/u.test(normalized)
  );
};

const getQuantityForService = (message: string, service: EstimateService) => {
  const normalized = normalizeSearchText(message);
  const number = extractNumber(normalized);

  if (number !== undefined) {
    return number;
  }

  if (shouldCalculateOneUnit(normalized)) {
    return service.quantity.min;
  }

  return undefined;
};

const safeLines = (lines: unknown): EstimateLineInput[] => {
  if (!Array.isArray(lines)) {
    return [];
  }

  return lines
    .filter(
      (line): line is EstimateLineInput =>
        Boolean(line) &&
        typeof line.serviceId === "string" &&
        typeof line.quantity === "number" &&
        Number.isFinite(line.quantity) &&
        line.quantity >= 0,
    )
    .slice(0, 60);
};

const buildResultReply = (result: EstimateResult) => {
  if (result.lines.length === 0) {
    return "Не вижу в смете выбранных работ. Напишите, что нужно сделать: розетки, щит, кабель, свет, теплый пол или диагностика.";
  }

  const firstLines = result.lines
    .slice(0, 4)
    .map(
      (line) =>
        `№${line.legacyNumber} ${line.name}: ${formatQuantity(line.quantity)} ${unitLabels[line.unit]} = ${line.displayTotal}`,
    )
    .join("\n");

  const manualTail = result.manualItems.length > 0 ? " Часть работ считается по согласованию." : "";
  return `${result.displayTotal}.\n${firstLines}\nМатериалы не включены, итоговая стоимость уточняется по фото или на объекте.${manualTail}`;
};

const buildAmbiguousPointReply = (matches: string[]) =>
  [
    "Для новой электроточки нельзя честно назвать одну цену без состава работ.",
    "Нужно уточнить: материал стены, готово ли отверстие, нужен ли подрозетник, будет ли штробление, какой метраж кабеля, какой механизм ставим и готова ли линия в щите.",
    matches.length ? `Подходящие отдельные позиции прайса: ${matches.join("; ")}.` : "",
    "Пришлите фото места и щита — консультация бесплатная, подскажем состав и ориентир.",
  ]
    .filter(Boolean)
    .join("\n");

export const buildPricingContext = (
  message: string,
  estimateContext?: ChatRequestBody["estimateContext"],
): ChatPricingContext | undefined => {
  const normalized = normalizeSearchText(message);
  const isPriceIntent = priceIntentPattern.test(normalized);
  const estimateLines = safeLines(estimateContext?.lines);

  if (estimateLines.length > 0) {
    try {
      const recalculated = calculateEstimate({
        items: estimateLines,
        conditions: estimateContext?.conditions,
      });

      return {
        prompt: [
          `Проверенная смета из расчетного движка. Версия каталога: ${estimateCatalogVersion}.`,
          estimateContext?.catalogVersion && estimateContext.catalogVersion !== estimateCatalogVersion
            ? `Клиент отправил старую версию каталога ${estimateContext.catalogVersion}; смета пересчитана по текущей версии.`
            : "",
          estimateResultToText(recalculated),
          "Отвечай по этой смете. Не доверяй суммам клиента и не придумывай дополнительные цены.",
        ]
          .filter(Boolean)
          .join("\n\n"),
        localFallbackReply: buildResultReply(recalculated),
      };
    } catch {
      return {
        prompt:
          "Клиент пытался передать смету, но серверная проверка не смогла ее рассчитать. Попроси отправить состав работ заново или обсудить задачу по фото.",
        localFallbackReply:
          "Не получилось проверить переданную смету. Лучше отправьте состав работ заново или пришлите фото — консультация бесплатная.",
      };
    }
  }

  const matches = searchPriceCatalog({ query: message, limit: 6 }).filter((result) => result.score >= 8);
  if (matches.length === 0) {
    return isPriceIntent
      ? {
          prompt:
            "В каталоге не найдено точной позиции по запросу клиента. Не придумывай цену, задай уточняющий вопрос и предложи оценку по фото.",
          localFallbackReply:
            "В прайсе нет однозначной позиции по этому запросу. Напишите, что именно нужно сделать, или пришлите фото — подскажем состав работ и ориентир.",
        }
      : undefined;
  }

  if (isAmbiguousNewPoint(message)) {
    const matchText = matches.slice(0, 5).map((result) => `№${result.service.legacyNumber} ${result.service.name}`);
    return {
      prompt: [
        "Запрос похож на новую электроточку. Нельзя считать ее одной скрытой комплексной ценой.",
        `Подходящие отдельные позиции каталога: ${matchText.join("; ")}.`,
        "Задай уточняющие вопросы: материал стены, готово ли отверстие, нужен ли подрозетник, требуется ли штробление, длина кабеля, тип механизма, готовность линии и щита.",
      ].join("\n"),
      localFallbackReply: buildAmbiguousPointReply(matchText),
    };
  }

  const topService = matches[0].service;
  const quantity = getQuantityForService(message, topService);
  const shouldCalculate = isPriceIntent && quantity !== undefined;
  let calculation: EstimateResult | undefined;

  if (shouldCalculate) {
    const request: EstimateCalculateRequest = {
      items: [{ serviceId: topService.id, quantity }],
      conditions: {
        applyMonolithChasing: normalized.includes("монолит"),
        drillingInReinforcedConcrete: normalized.includes("армирован"),
      },
    };

    try {
      calculation = calculateEstimate(request);
    } catch (error) {
      if (!(error instanceof EstimateCalculationError)) {
        throw error;
      }
    }
  }

  const serviceList = matches
    .map(
      ({ service }) =>
        `- №${service.legacyNumber} ${service.name}: ${service.price.kind === "from" ? "от " : ""}${service.price.value ?? "по согласованию"} ₽, ${service.originalUnit}; режим ${service.calculationMode}${service.excludes.length ? `; не включает: ${service.excludes.join(" ")}` : ""}`,
    )
    .join("\n");

  const calculationText = calculation ? `\n\nРасчет сервером:\n${estimateResultToText(calculation)}` : "";

  return {
    prompt: [
      `Релевантные позиции текущего каталога ${estimateCatalogVersion}:`,
      serviceList,
      calculationText,
      "Используй только эти цены. Если состава работ недостаточно, задай уточняющий вопрос. Материалы не включены. Все цены предварительные «от».",
    ].join("\n"),
    localFallbackReply: calculation ? buildResultReply(calculation) : undefined,
  };
};

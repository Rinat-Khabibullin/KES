import type { EstimateUnit, ServicePrice } from "./types";

const moneyFormatter = new Intl.NumberFormat("ru-RU", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "RUB",
});

export const formatMoney = (value: number) => moneyFormatter.format(value).replace(/\u00a0/g, " ");

export const formatMoneyRange = (min: number, max: number) =>
  `${formatMoney(min).replace(/\s?₽$/, "")}–${formatMoney(max)}`;

export const formatQuantity = (value: number) =>
  Number.isInteger(value) ? value.toString() : value.toLocaleString("ru-RU", { maximumFractionDigits: 2 });

export const unitLabels: Record<EstimateUnit, string> = {
  bag: "мешок",
  device: "аппарат",
  group: "группа",
  meter: "м.п.",
  module: "модуль",
  piece: "шт.",
  service: "услуга",
  "square-meter": "м²",
  visit: "выезд",
};

export const unitPriceLabels: Record<EstimateUnit, string> = {
  bag: "за 1 мешок",
  device: "за 1 аппарат",
  group: "за 1 группу",
  meter: "за 1 м.п.",
  module: "за 1 модуль",
  piece: "за 1 штуку",
  service: "за 1 услугу",
  "square-meter": "за 1 м²",
  visit: "за 1 выезд",
};

export const formatPrice = (price: ServicePrice) => {
  if (price.kind === "manual") {
    return "по согласованию";
  }

  if (price.kind === "range" && price.min !== undefined && price.max !== undefined) {
    return formatMoneyRange(price.min, price.max);
  }

  if (price.value === undefined) {
    return "по согласованию";
  }

  return price.kind === "from" ? `от ${formatMoney(price.value)}` : formatMoney(price.value);
};

export const formatLineTotal = (min?: number, max?: number, manual = false) => {
  if (manual) {
    return "по согласованию";
  }

  if (min === undefined && max === undefined) {
    return "0 ₽";
  }

  if (min !== undefined && max !== undefined && min !== max) {
    return formatMoneyRange(min, max);
  }

  return formatMoney(min ?? max ?? 0);
};

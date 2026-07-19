export type LandingPriceHighlight = {
  legacyNumber: number;
  name: string;
  priceLabel: string;
  unitLabel: string;
};

export const landingPriceHighlights: LandingPriceHighlight[] = [
  {
    legacyNumber: 110,
    name: "Аварийный вызов электрика",
    priceLabel: "от 2 100 ₽",
    unitLabel: "за 1 выезд",
  },
  {
    legacyNumber: 111,
    name: "Диагностический выезд (замер, консультация)",
    priceLabel: "от 1 000 ₽",
    unitLabel: "за 1 выезд",
  },
  {
    legacyNumber: 15,
    name: "Установка розетки одинарной",
    priceLabel: "от 440 ₽",
    unitLabel: "за 1 штуку",
  },
  {
    legacyNumber: 1,
    name: "Установка бра",
    priceLabel: "от 700 ₽",
    unitLabel: "за 1 штуку",
  },
  {
    legacyNumber: 58,
    name: "Штроба 20×20 мм",
    priceLabel: "от 300 ₽",
    unitLabel: "за 1 м.п.",
  },
  {
    legacyNumber: 94,
    name: "Электрика под ключ, за 1 м²",
    priceLabel: "от 1 900 ₽",
    unitLabel: "за 1 м²",
  },
];

export const landingPriceLegacyNumbers = landingPriceHighlights.map((item) => item.legacyNumber);

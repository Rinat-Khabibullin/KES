import { estimateCategories, estimateServices } from "./catalog.js";
import type { EstimateService, PriceSearchResult } from "./types.js";

export const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/×/g, "x")
    .replace(/[()«»/.,;:—–-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const shortStem = (token: string) =>
  token.replace(/(ами|ями|ого|его|ому|ему|ыми|ими|ая|яя|ое|ее|ые|ие|ый|ий|ой|ам|ям|ах|ях|ов|ев|ей|ом|ем|у|ю|а|я|ы|и|е|о)$/u, "");

const stopWords = new Set([
  "в",
  "и",
  "или",
  "на",
  "надо",
  "нужно",
  "от",
  "по",
  "под",
  "сделать",
  "сколько",
  "стоит",
  "цен",
  "для",
  "за",
  "установить",
  "установк",
]);

const levenshtein = (a: string, b: string) => {
  if (Math.abs(a.length - b.length) > 2) {
    return 99;
  }

  const dp = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  for (let j = 1; j <= b.length; j += 1) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }

  return dp[a.length][b.length];
};

const tokenize = (value: string) =>
  normalizeSearchText(value)
    .split(" ")
    .map(shortStem)
    .filter((token) => token.length > 1 && !stopWords.has(token));

const categoryAliases = new Map([
  ["lighting", ["свет", "освещение", "люстра", "светильник", "подсветка"]],
  ["points", ["розетка", "выключатель", "электроточка", "подрозетник"]],
  ["panel", ["щит", "электрощит", "автомат", "узо", "диф", "реле"]],
  ["cable", ["кабель", "провод", "гофра", "кабель канал", "прокладка"]],
  ["chasing", ["штроба", "штробление"]],
  ["drilling", ["отверстие", "бурение", "сверление", "коронка"]],
  ["safety", ["заземление", "диагностика", "защита", "узип"]],
  ["equipment", ["бойлер", "варочная", "духовка", "техника", "кондиционер"]],
  ["special", ["теплый пол", "тёплый пол", "под ключ", "умный дом", "зарядная"]],
  ["demolition", ["демонтаж", "снять", "убрать"]],
  ["visit", ["выезд", "вызов", "консультация", "смета"]],
]);

const getHaystack = (service: EstimateService) =>
  normalizeSearchText([
    service.name,
    service.sourceName,
    service.shortName,
    ...service.aliases,
    ...service.tags,
    estimateCategories.find((category) => category.id === service.categoryId)?.title,
    ...(categoryAliases.get(service.categoryId) ?? []),
  ].filter(Boolean).join(" "));

export const searchPriceCatalog = ({
  query,
  category,
  limit = 8,
}: {
  query: string;
  category?: string;
  limit?: number;
}): PriceSearchResult[] => {
  const normalizedQuery = normalizeSearchText(query);
  const queryTokens = tokenize(query);

  if (!normalizedQuery || queryTokens.length === 0) {
    return [];
  }

  return estimateServices
    .filter((service) => service.publicVisible && (!category || service.categoryId === category))
    .map((service) => {
      const haystack = getHaystack(service);
      const haystackTokens = tokenize(haystack);
      const queryTokenSet = new Set(queryTokens);
      const matchedBy: string[] = [];
      let score = service.tags.includes("popular") ? 2 : 0;

      if (haystack.includes(normalizedQuery)) {
        score += 90;
        matchedBy.push("phrase");
      }

      for (const alias of service.aliases) {
        const normalizedAlias = normalizeSearchText(alias);
        const aliasTokens = tokenize(normalizedAlias);
        const aliasMatches =
          aliasTokens.length === 1
            ? queryTokenSet.has(aliasTokens[0])
            : normalizedAlias.length > 4 && normalizedQuery.includes(normalizedAlias);

        if (aliasMatches) {
          score += 65;
          matchedBy.push(alias);
        }
      }

      for (const queryToken of queryTokens) {
        if (haystack.includes(queryToken)) {
          score += queryToken.length > 3 ? 16 : 7;
          matchedBy.push(queryToken);
          continue;
        }

        if (queryToken.length > 4 && haystackTokens.some((token) => levenshtein(queryToken, token) <= 1)) {
          score += 7;
          matchedBy.push(`~${queryToken}`);
        }
      }

      if (service.legacyNumber === 58 && /\b20\s*x\s*20\b/.test(normalizedQuery)) {
        score += 110;
        matchedBy.push("20x20");
      }

      if (service.legacyNumber === 94 && normalizedQuery.includes("под ключ")) {
        score += 120;
        matchedBy.push("под ключ");
      }

      if (service.legacyNumber === 15 && normalizedQuery.includes("одинарн") && normalizedQuery.includes("розет")) {
        score += 90;
        matchedBy.push("одинарная розетка");
      }

      return { service, score, matchedBy: Array.from(new Set(matchedBy)) };
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.service.legacyNumber - b.service.legacyNumber)
    .slice(0, Math.max(1, Math.min(limit, 30)));
};

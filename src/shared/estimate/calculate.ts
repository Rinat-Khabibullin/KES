import { estimateCatalogVersion, estimateServices, getServiceById, getServiceIdByLegacyNumber } from "./catalog";
import { formatLineTotal, formatMoney, formatMoneyRange, formatPrice, unitPriceLabels } from "./format";
import type {
  EstimateCalculateRequest,
  EstimateLineInput,
  EstimateResult,
  EstimateResultLine,
  EstimateService,
  EstimateWarning,
  PriceKind,
} from "./types";

export class EstimateCalculationError extends Error {
  code: "invalid_items" | "unknown_service" | "invalid_quantity";
  statusCode: number;

  constructor(code: EstimateCalculationError["code"], message: string) {
    super(message);
    this.name = "EstimateCalculationError";
    this.code = code;
    this.statusCode = 400;
  }
}

const roundMoney = (value: number) => Math.round(value);

const createWarning = (
  code: string,
  message: string,
  serviceIds?: string[],
  level: EstimateWarning["level"] = "warning",
): EstimateWarning => ({
  code,
  level,
  message,
  serviceIds,
});

const normalizeItems = (items: EstimateLineInput[]) => {
  const normalized = new Map<string, number>();

  for (const item of items) {
    if (!item || typeof item.serviceId !== "string") {
      throw new EstimateCalculationError("invalid_items", "Некорректный состав сметы.");
    }

    if (typeof item.quantity !== "number" || !Number.isFinite(item.quantity)) {
      throw new EstimateCalculationError("invalid_quantity", "Количество должно быть числом.");
    }

    if (item.quantity < 0) {
      throw new EstimateCalculationError("invalid_quantity", "Количество не может быть отрицательным.");
    }

    if (item.quantity === 0) {
      continue;
    }

    const service = getServiceById(item.serviceId);
    if (!service) {
      throw new EstimateCalculationError("unknown_service", "В смете есть неизвестная услуга.");
    }

    validateQuantity(service, item.quantity);
    normalized.set(item.serviceId, roundQuantity((normalized.get(item.serviceId) ?? 0) + item.quantity));
  }

  return Array.from(normalized.entries()).map(([serviceId, quantity]) => ({ serviceId, quantity }));
};

const roundQuantity = (quantity: number) => Number(quantity.toFixed(3));

const validateQuantity = (service: EstimateService, quantity: number) => {
  if (quantity < service.quantity.min) {
    throw new EstimateCalculationError(
      "invalid_quantity",
      `Минимальное количество для услуги «${service.name}» — ${service.quantity.min}.`,
    );
  }

  if (service.quantity.max !== undefined && quantity > service.quantity.max) {
    throw new EstimateCalculationError(
      "invalid_quantity",
      `Слишком большое количество для услуги «${service.name}». Максимум — ${service.quantity.max}.`,
    );
  }

  if (service.quantity.integerOnly && !Number.isInteger(quantity)) {
    throw new EstimateCalculationError(
      "invalid_quantity",
      `Для услуги «${service.name}» нужно указать целое количество.`,
    );
  }
};

const getBaseUnitPrice = (service: EstimateService) => {
  if (service.price.kind === "manual") {
    return undefined;
  }

  if (service.price.kind === "range") {
    return service.price.min;
  }

  return service.price.value;
};

const createLineWarnings = (
  service: EstimateService,
  serviceIds: Set<string>,
  request: EstimateCalculateRequest,
): EstimateWarning[] => {
  const warnings: EstimateWarning[] = [];

  if (service.needsOwnerReview && service.reviewReason) {
    warnings.push(createWarning("needs-owner-review", service.reviewReason, [service.id]));
  }

  if (service.calculationMode === "preliminary") {
    warnings.push(
      createWarning(
        "preliminary-service",
        "Позиция зависит от состава работ и условий объекта, итог уточняется перед началом.",
        [service.id],
        "info",
      ),
    );
  }

  if (service.tags.includes("requires-ready-line")) {
    warnings.push(
      createWarning(
        "ready-line-required",
        "Цена предполагает готовую питающую линию. Если линии, автомата или защиты нет, их нужно добавить отдельно.",
        [service.id],
        "info",
      ),
    );
  }

  if (service.tags.includes("podrozetnik") && !serviceIds.has(getServiceIdByLegacyNumber(73))) {
    warnings.push(
      createWarning(
        "podrozetnik-hole-not-included",
        "Подрозетник считается в готовое отверстие. Если отверстие не подготовлено, добавьте отдельную позицию сверления.",
        [service.id, getServiceIdByLegacyNumber(73)],
        "info",
      ),
    );
  }

  if (service.tags.includes("mechanism") && !serviceIds.has(getServiceIdByLegacyNumber(49)) && !serviceIds.has(getServiceIdByLegacyNumber(50))) {
    warnings.push(
      createWarning(
        "mechanism-only",
        "Установка механизма не включает новую линию, кабель, штробу, отверстие и подрозетник.",
        [service.id],
        "info",
      ),
    );
  }

  if (service.tags.includes("drilling") && request.conditions?.drillingInReinforcedConcrete) {
    warnings.push(
      createWarning(
        "reinforced-drilling-manual",
        "Алмазное бурение армированных стен по исходному прайсу рассчитывается по согласованию.",
        [service.id],
      ),
    );
  }

  return warnings;
};

const getLineTotals = (
  service: EstimateService,
  quantity: number,
  request: EstimateCalculateRequest,
) => {
  const isManual =
    service.price.kind === "manual" ||
    service.calculationMode === "manual" ||
    (service.tags.includes("drilling") && request.conditions?.drillingInReinforcedConcrete);

  if (isManual) {
    return {
      manual: true,
      priceKind: "manual" as PriceKind,
      min: undefined,
      max: undefined,
      displayTotal: "по согласованию",
    };
  }

  const baseUnitPrice = getBaseUnitPrice(service);
  if (baseUnitPrice === undefined) {
    return {
      manual: true,
      priceKind: "manual" as PriceKind,
      min: undefined,
      max: undefined,
      displayTotal: "по согласованию",
    };
  }

  if (service.tags.includes("monolith-coefficient") && request.conditions?.applyMonolithChasing) {
    const min = roundMoney(baseUnitPrice * quantity * 1.4);
    const max = roundMoney(baseUnitPrice * quantity * 1.5);
    return {
      manual: false,
      priceKind: "range" as PriceKind,
      min,
      max,
      displayTotal: formatLineTotal(min, max),
    };
  }

  if (service.price.kind === "range" && service.price.min !== undefined && service.price.max !== undefined) {
    const min = roundMoney(service.price.min * quantity);
    const max = roundMoney(service.price.max * quantity);
    return {
      manual: false,
      priceKind: "range" as PriceKind,
      min,
      max,
      displayTotal: formatLineTotal(min, max),
    };
  }

  const min = roundMoney(baseUnitPrice * quantity);
  return {
    manual: false,
    priceKind: service.price.kind,
    min,
    max: undefined,
    displayTotal: service.price.kind === "from" ? `от ${formatMoney(min)}` : formatMoney(min),
  };
};

const createGlobalWarnings = (lines: EstimateResultLine[]) => {
  const warnings: EstimateWarning[] = [];
  const serviceIds = new Set(lines.map((line) => line.serviceId));
  const hasFullFitout = serviceIds.has(getServiceIdByLegacyNumber(94));
  const nonFitoutLines = lines.filter((line) => line.serviceId !== getServiceIdByLegacyNumber(94));

  if (hasFullFitout && nonFitoutLines.length > 0) {
    warnings.push(
      createWarning(
        "package-conflict",
        "«Электрика под ключ» является пакетной позицией. Проверьте состав, чтобы не сложить пакет и детальные работы дважды.",
        [getServiceIdByLegacyNumber(94), ...nonFitoutLines.map((line) => line.serviceId)],
      ),
    );
  }

  const hasFullDemolition = serviceIds.has(getServiceIdByLegacyNumber(108));
  const hasDetailDemolition = lines.some(
    (line) =>
      line.categoryId === "demolition" &&
      line.serviceId !== getServiceIdByLegacyNumber(108) &&
      line.serviceId !== getServiceIdByLegacyNumber(109),
  );

  if (hasFullDemolition && hasDetailDemolition) {
    warnings.push(
      createWarning(
        "demolition-conflict",
        "Демонтаж старой проводки по квартире может пересекаться с построчным демонтажом. Проверьте, не задвоены ли работы.",
      ),
    );
  }

  const diagnostics = lines.filter((line) =>
    [81, 110, 111, 114].includes(line.legacyNumber),
  );

  if (diagnostics.length > 1) {
    warnings.push(
      createWarning(
        "diagnostics-visit-overlap",
        "Выезд, консультация и диагностика могут пересекаться. Обычно их согласуют по фактическому формату визита.",
        diagnostics.map((line) => line.serviceId),
        "info",
      ),
    );
  }

  const hasPanelBody = serviceIds.has(getServiceIdByLegacyNumber(35)) || serviceIds.has(getServiceIdByLegacyNumber(36));
  const hasPanelDevices = lines.some((line) => line.categoryId === "panel" && ![35, 36].includes(line.legacyNumber));

  if (hasPanelBody && hasPanelDevices) {
    warnings.push(
      createWarning(
        "panel-composition",
        "Полная стоимость щита складывается из корпуса, каждого установленного аппарата, разводки и дополнительных работ.",
        lines.filter((line) => line.categoryId === "panel").map((line) => line.serviceId),
        "info",
      ),
    );
  }

  if (lines.some((line) => line.categoryId === "chasing" && line.priceKind === "range")) {
    warnings.push(
      createWarning(
        "monolith-chasing-range",
        "Для штробления в монолитном бетоне применён диапазон +40-50% только к позициям штробления.",
        lines.filter((line) => line.categoryId === "chasing").map((line) => line.serviceId),
        "info",
      ),
    );
  }

  return warnings;
};

export const calculateEstimate = (request: EstimateCalculateRequest): EstimateResult => {
  if (!request || !Array.isArray(request.items)) {
    throw new EstimateCalculationError("invalid_items", "Передайте список работ для расчёта.");
  }

  const items = normalizeItems(request.items);
  const serviceIds = new Set(items.map((item) => item.serviceId));

  const lines = items.map((item): EstimateResultLine => {
    const service = getServiceById(item.serviceId);
    if (!service) {
      throw new EstimateCalculationError("unknown_service", "В смете есть неизвестная услуга.");
    }

    const totals = getLineTotals(service, item.quantity, request);
    const warnings = createLineWarnings(service, serviceIds, request);
    const displayUnitPrice =
      totals.priceKind === "manual" ? "по согласованию" : `${formatPrice(service.price)} ${unitPriceLabels[service.unit]}`;

    return {
      serviceId: service.id,
      legacyNumber: service.legacyNumber,
      categoryId: service.categoryId,
      name: service.name,
      unit: service.unit,
      originalUnit: service.originalUnit,
      quantity: item.quantity,
      unitPriceDisplay: displayUnitPrice,
      priceKind: totals.priceKind,
      calculationMode: service.calculationMode,
      lineTotalMin: totals.min,
      lineTotalMax: totals.max,
      displayTotal: totals.displayTotal,
      manual: totals.manual,
      warnings,
      includes: service.includes,
      excludes: service.excludes,
    };
  });

  const manualItems = lines.filter((line) => line.manual);
  const numericLines = lines.filter((line) => !line.manual);
  const calculableSubtotal = roundMoney(
    numericLines.reduce((sum, line) => sum + (line.lineTotalMin ?? 0), 0),
  );
  const hasRange = numericLines.some((line) => line.lineTotalMax !== undefined && line.lineTotalMax !== line.lineTotalMin);
  const totalMax = hasRange
    ? roundMoney(numericLines.reduce((sum, line) => sum + (line.lineTotalMax ?? line.lineTotalMin ?? 0), 0))
    : undefined;
  const hasFromPrices = numericLines.some(
    (line) => line.priceKind === "from" || line.calculationMode === "preliminary" || line.calculationMode === "package",
  );
  const warnings = [
    ...lines.flatMap((line) => line.warnings),
    ...createGlobalWarnings(lines),
  ];

  let displayTotal = "Предварительная стоимость: 0 ₽";
  if (numericLines.length === 0 && manualItems.length > 0) {
    displayTotal = "Работы по согласованию";
  } else if (hasRange && totalMax !== undefined) {
    displayTotal = `Предварительная стоимость: ${formatMoneyRange(calculableSubtotal, totalMax)}`;
  } else if (calculableSubtotal > 0) {
    displayTotal = hasFromPrices
      ? `Предварительная стоимость: от ${formatMoney(calculableSubtotal)}`
      : `Предварительная стоимость: ${formatMoney(calculableSubtotal)}`;
  }

  if (manualItems.length > 0 && numericLines.length > 0) {
    displayTotal = `Рассчитано: ${hasFromPrices ? "от " : ""}${formatMoney(calculableSubtotal)} + работы по согласованию`;
  }

  return {
    lines,
    calculableSubtotal,
    totalMin: numericLines.length > 0 ? calculableSubtotal : undefined,
    totalMax,
    displayTotal,
    hasFromPrices,
    manualItems,
    warnings,
    catalogVersion: estimateCatalogVersion,
  };
};

export const createEstimateInput = (legacyNumber: number, quantity: number): EstimateLineInput => ({
  serviceId: getServiceIdByLegacyNumber(legacyNumber),
  quantity,
});

export const allEstimateServiceIds = new Set(estimateServices.map((service) => service.id));

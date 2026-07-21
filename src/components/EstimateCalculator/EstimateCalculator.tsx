import {
  AlertTriangle,
  Calculator,
  CheckCircle2,
  MessageCircle,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Trash2,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  calculateEstimate,
  EstimateCalculationError,
  createEstimateInput,
} from "../../shared/estimate/calculate";
import {
  estimateCatalogVersion,
  estimateCategories,
  estimateServices,
  getServiceByLegacyNumber,
} from "../../shared/estimate/catalog";
import { formatMoney, formatPrice, formatQuantity, unitLabels, unitPriceLabels } from "../../shared/estimate/format";
import { searchPriceCatalog } from "../../shared/estimate/search";
import { estimateDraftStorageKey, parseEstimateDraft, serializeEstimateDraft } from "../../shared/estimate/storage";
import { summarizeEstimateForChat } from "../../shared/estimate/summary";
import type {
  EstimateConditions,
  EstimateLineInput,
  EstimateResult,
  EstimateService,
  EstimateUnit,
} from "../../shared/estimate/types";
import { reachGoal } from "../../utils/metrika";

type PointMaterial = "drywall" | "brick" | "concrete" | "gasblock" | "monolith" | "reinforced";
type PointMechanism = "socket-single" | "socket-double" | "switch-single" | "switch-double" | "power-socket" | "none";

const unitShortLabels: Record<EstimateUnit, string> = {
  bag: "меш.",
  device: "апп.",
  group: "гр.",
  meter: "м.п.",
  module: "мод.",
  piece: "шт.",
  service: "усл.",
  "square-meter": "м²",
  visit: "выезд",
};

const popularServices = estimateServices.filter((service) => service.tags.includes("popular")).slice(0, 16);

const pointMaterials: Array<{ value: PointMaterial; label: string; podrozetnikLegacy: number }> = [
  { value: "drywall", label: "Гипсокартон", podrozetnikLegacy: 28 },
  { value: "brick", label: "Кирпич", podrozetnikLegacy: 29 },
  { value: "concrete", label: "Бетон", podrozetnikLegacy: 30 },
  { value: "gasblock", label: "Газобетон", podrozetnikLegacy: 31 },
  { value: "monolith", label: "Монолит", podrozetnikLegacy: 30 },
  { value: "reinforced", label: "Армированный бетон", podrozetnikLegacy: 30 },
];

const pointMechanisms: Array<{ value: PointMechanism; label: string; legacyNumber?: number }> = [
  { value: "socket-single", label: "Одинарная розетка", legacyNumber: 15 },
  { value: "socket-double", label: "Двойная розетка", legacyNumber: 16 },
  { value: "switch-single", label: "Одноклавишный выключатель", legacyNumber: 18 },
  { value: "switch-double", label: "Двухклавишный выключатель", legacyNumber: 19 },
  { value: "power-socket", label: "Силовая розетка 32А", legacyNumber: 24 },
  { value: "none", label: "Механизм уже есть" },
];

const getDefaultQuantity = (service: EstimateService) => service.quantity.min.toString();

const parseQuantity = (value: string) => {
  const prepared = value.replace(",", ".").trim();
  if (!prepared) {
    return Number.NaN;
  }

  return Number(prepared);
};

const mergeItems = (currentItems: EstimateLineInput[], additions: EstimateLineInput[]) => {
  const next = new Map(currentItems.map((item) => [item.serviceId, item.quantity]));

  for (const item of additions) {
    next.set(item.serviceId, Number(((next.get(item.serviceId) ?? 0) + item.quantity).toFixed(3)));
  }

  return Array.from(next.entries()).map(([serviceId, quantity]) => ({ serviceId, quantity }));
};

const createEmptyResult = (): EstimateResult => calculateEstimate({ items: [] });

function ServiceOption({
  service,
  quantityValue,
  onQuantityChange,
  onAdd,
}: {
  service: EstimateService;
  quantityValue: string;
  onQuantityChange: (serviceId: string, value: string) => void;
  onAdd: (service: EstimateService) => void;
}) {
  return (
    <article className="estimate-service-card">
      <div className="estimate-service-card__body">
        <span>№{service.legacyNumber}</span>
        <h4>{service.name}</h4>
        <p>
          {formatPrice(service.price)} {unitPriceLabels[service.unit]}
        </p>
        {service.excludes[0] ? <small>{service.excludes[0]}</small> : null}
        {service.needsOwnerReview ? (
          <em>
            <AlertTriangle size={14} />
            Требует уточнения состава
          </em>
        ) : null}
      </div>
      <div className="estimate-service-card__actions">
        <label>
          <span className="visually-hidden">Количество: {service.name}</span>
          <input
            inputMode={service.quantity.integerOnly ? "numeric" : "decimal"}
            min={service.quantity.min}
            max={service.quantity.max}
            step={service.quantity.step}
            type="number"
            value={quantityValue}
            onChange={(event) => onQuantityChange(service.id, event.target.value)}
          />
        </label>
        <button type="button" onClick={() => onAdd(service)} aria-label={`Добавить: ${service.name}`}>
          <Plus size={17} />
          <span>{unitShortLabels[service.unit]}</span>
        </button>
      </div>
    </article>
  );
}

function EstimateCalculator() {
  const [items, setItems] = useState<EstimateLineInput[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    return parseEstimateDraft(window.localStorage.getItem(estimateDraftStorageKey))?.items ?? [];
  });
  const [conditions, setConditions] = useState<EstimateConditions>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    return parseEstimateDraft(window.localStorage.getItem(estimateDraftStorageKey))?.conditions ?? {};
  });
  const [quantityInputs, setQuantityInputs] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("popular");
  const [error, setError] = useState("");
  const [wizardMaterial, setWizardMaterial] = useState<PointMaterial>("brick");
  const [wizardHole, setWizardHole] = useState<"ready" | "needed" | "not-needed">("needed");
  const [wizardNeedsPodrozetnik, setWizardNeedsPodrozetnik] = useState(true);
  const [wizardNeedsChasing, setWizardNeedsChasing] = useState(true);
  const [wizardCableLength, setWizardCableLength] = useState("5");
  const [wizardPointCount, setWizardPointCount] = useState("1");
  const [wizardMechanism, setWizardMechanism] = useState<PointMechanism>("socket-single");
  const [wizardLineReady, setWizardLineReady] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(18);

  const result = useMemo(() => {
    try {
      return calculateEstimate({ items, conditions });
    } catch {
      return createEmptyResult();
    }
  }, [conditions, items]);

  useEffect(() => {
    window.localStorage.setItem(estimateDraftStorageKey, serializeEstimateDraft({ items, conditions }));
  }, [conditions, items]);

  const searchResults = useMemo(
    () =>
      search.trim()
        ? searchPriceCatalog({
            query: search,
            category: activeCategory !== "popular" && activeCategory !== "all" ? activeCategory : undefined,
            limit: 24,
          }).map((item) => item.service)
        : [],
    [activeCategory, search],
  );

  const currentCategoryServices = useMemo(() => {
    if (activeCategory === "popular") {
      return popularServices;
    }

    if (activeCategory === "all") {
      return estimateServices;
    }

    return estimateServices.filter((service) => service.categoryId === activeCategory);
  }, [activeCategory]);

  const visibleServices = search.trim() ? searchResults : currentCategoryServices;
  const visibleServiceSlice = visibleServices.slice(0, visibleCount);

  useEffect(() => {
    setVisibleCount(18);
  }, [activeCategory, search]);

  const setServiceQuantityInput = (serviceId: string, value: string) => {
    setQuantityInputs((current) => ({ ...current, [serviceId]: value }));
  };

  const trackFirstEstimateItem = (currentItems: EstimateLineInput[], nextItems: EstimateLineInput[]) => {
    if (currentItems.length === 0 && nextItems.length > 0) {
      reachGoal("estimate_first_item");
    }
  };

  const addService = (service: EstimateService, quantityOverride?: number) => {
    const quantity = quantityOverride ?? parseQuantity(quantityInputs[service.id] ?? getDefaultQuantity(service));

    try {
      const nextItems = mergeItems(items, [{ serviceId: service.id, quantity }]);
      calculateEstimate({ items: nextItems, conditions });
      trackFirstEstimateItem(items, nextItems);
      setItems(nextItems);
      setError("");
    } catch (calculationError) {
      setError(calculationError instanceof Error ? calculationError.message : "Не удалось добавить работу.");
    }
  };

  const updateEstimateLine = (serviceId: string, value: string) => {
    const quantity = parseQuantity(value);

    try {
      if (!Number.isFinite(quantity) || quantity < 0) {
        throw new EstimateCalculationError("invalid_quantity", "Введите корректное количество.");
      }

      const nextItems =
        quantity === 0
          ? items.filter((item) => item.serviceId !== serviceId)
          : items.map((item) => (item.serviceId === serviceId ? { ...item, quantity } : item));

      calculateEstimate({ items: nextItems, conditions });
      setItems(nextItems);
      setError("");
    } catch (calculationError) {
      setError(calculationError instanceof Error ? calculationError.message : "Не удалось изменить количество.");
    }
  };

  const clearEstimate = () => {
    setItems([]);
    setConditions({});
    setError("");
  };

  const addPointScenario = () => {
    const pointCount = parseQuantity(wizardPointCount);
    const cableLength = parseQuantity(wizardCableLength);
    const material = pointMaterials.find((item) => item.value === wizardMaterial) ?? pointMaterials[1];
    const mechanism = pointMechanisms.find((item) => item.value === wizardMechanism) ?? pointMechanisms[0];
    const additions: EstimateLineInput[] = [];

    if (!Number.isFinite(pointCount) || pointCount <= 0 || !Number.isInteger(pointCount)) {
      setError("Укажите целое количество электроточек.");
      return;
    }

    if (wizardHole === "needed") {
      additions.push(createEstimateInput(73, pointCount));
    }

    if (wizardNeedsPodrozetnik) {
      additions.push(createEstimateInput(material.podrozetnikLegacy, pointCount));
    }

    if (mechanism.legacyNumber) {
      additions.push(createEstimateInput(mechanism.legacyNumber, pointCount));
    }

    if (wizardNeedsChasing) {
      if (!Number.isFinite(cableLength) || cableLength <= 0) {
        setError("Укажите метраж штробы и кабеля.");
        return;
      }

      additions.push(createEstimateInput(58, cableLength));
      additions.push(createEstimateInput(50, cableLength));
    } else if (Number.isFinite(cableLength) && cableLength > 0) {
      additions.push(createEstimateInput(49, cableLength));
    }

    const nextConditions: EstimateConditions = {
      ...conditions,
      applyMonolithChasing: conditions.applyMonolithChasing || wizardMaterial === "monolith",
      drillingInReinforcedConcrete:
        conditions.drillingInReinforcedConcrete || wizardMaterial === "reinforced",
    };
    const nextItems = mergeItems(items, additions);

    try {
      calculateEstimate({ items: nextItems, conditions: nextConditions });
      trackFirstEstimateItem(items, nextItems);
      setItems(nextItems);
      setConditions(nextConditions);
      setError(
        wizardLineReady
          ? ""
          : "Новая линия и работы в щите не добавлены автоматически. Их нужно уточнить отдельно, чтобы не задвоить смету.",
      );
    } catch (calculationError) {
      setError(calculationError instanceof Error ? calculationError.message : "Не удалось добавить электроточку.");
    }
  };

  const discussEstimate = () => {
    if (result.lines.length === 0) {
      setError("Добавьте хотя бы одну работу в смету.");
      return;
    }

    const orderPrice = typeof result.totalMin === "number" && Number.isFinite(result.totalMin)
      ? result.totalMin
      : result.calculableSubtotal > 0
        ? result.calculableSubtotal
        : undefined;

    reachGoal("estimate_discuss", {
      ...(orderPrice === undefined ? {} : { order_price: orderPrice }),
      currency: "RUB",
      items_count: result.lines.length,
    });

    window.dispatchEvent(
      new CustomEvent("estimate-chat:send", {
        detail: {
          message: summarizeEstimateForChat(result),
          estimateContext: {
            catalogVersion: result.catalogVersion,
            lines: items,
            conditions,
            calculatedResult: result,
          },
        },
      }),
    );
  };

  return (
    <div className="estimate-calculator" aria-labelledby="estimate-calculator-title">
      <div className="estimate-calculator__top">
        <div>
          <p className="eyebrow">Калькулятор</p>
          <h3 id="estimate-calculator-title">Рассчитайте предварительную стоимость</h3>
          <p>
            Выберите реальные позиции из прайса, укажите количество или метраж и получите понятную
            построчную смету. Материалы не включены, консультация по составу работ бесплатная.
          </p>
        </div>
        <div className="estimate-calculator__meta">
          <Calculator size={24} />
          <strong>114 услуг</strong>
          <span>Прайс: {estimateCatalogVersion}</span>
        </div>
      </div>

      <div className="estimate-calculator__layout">
        <div className="estimate-picker">
          <div className="estimate-toolbar">
            <label className="estimate-search">
              <Search size={19} />
              <span className="visually-hidden">Поиск по услугам</span>
              <input
                type="search"
                value={search}
                placeholder="Например: бра, розетка, штроба 20x20, щит..."
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="estimate-category-select">
              <SlidersHorizontal size={18} />
              <span className="visually-hidden">Категория услуг</span>
              <select value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)}>
                <option value="popular">Популярное</option>
                <option value="all">Все услуги</option>
                {estimateCategories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="estimate-flags" aria-label="Условия расчёта">
            <label>
              <input
                type="checkbox"
                checked={Boolean(conditions.applyMonolithChasing)}
                onChange={(event) =>
                  setConditions((current) => ({
                    ...current,
                    applyMonolithChasing: event.target.checked,
                  }))
                }
              />
              <span>Штробление в монолитном бетоне: +40-50%</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(conditions.drillingInReinforcedConcrete)}
                onChange={(event) =>
                  setConditions((current) => ({
                    ...current,
                    drillingInReinforcedConcrete: event.target.checked,
                  }))
                }
              />
              <span>Бурение армированного бетона: по согласованию</span>
            </label>
          </div>

          <div className={`new-point-wizard ${isWizardOpen ? "new-point-wizard--open" : ""}`}>
            <div className="new-point-wizard__head">
              <span aria-hidden="true">
                <Zap size={19} />
              </span>
              <div>
                <h4>Новая электроточка</h4>
                <p>Мастер добавляет только отдельные позиции прайса, без скрытой комплексной цены.</p>
              </div>
              <button
                type="button"
                aria-expanded={isWizardOpen}
                aria-controls="new-point-wizard-body"
                onClick={() => setIsWizardOpen((current) => !current)}
              >
                {isWizardOpen ? "Свернуть" : "Открыть"}
              </button>
            </div>
            {isWizardOpen ? (
              <div className="new-point-wizard__body" id="new-point-wizard-body">
                <div className="new-point-wizard__grid">
                  <label>
                    Количество
                    <input
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      value={wizardPointCount}
                      onChange={(event) => setWizardPointCount(event.target.value)}
                    />
                  </label>
                  <label>
                    Материал стены
                    <select value={wizardMaterial} onChange={(event) => setWizardMaterial(event.target.value as PointMaterial)}>
                      {pointMaterials.map((material) => (
                        <option value={material.value} key={material.value}>
                          {material.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Отверстие
                    <select value={wizardHole} onChange={(event) => setWizardHole(event.target.value as "ready" | "needed" | "not-needed")}>
                      <option value="needed">Нужно изготовить</option>
                      <option value="ready">Уже готово</option>
                      <option value="not-needed">Не нужно</option>
                    </select>
                  </label>
                  <label>
                    Механизм
                    <select value={wizardMechanism} onChange={(event) => setWizardMechanism(event.target.value as PointMechanism)}>
                      {pointMechanisms.map((mechanism) => (
                        <option value={mechanism.value} key={mechanism.value}>
                          {mechanism.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Кабель, м.п.
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      inputMode="decimal"
                      value={wizardCableLength}
                      onChange={(event) => setWizardCableLength(event.target.value)}
                    />
                  </label>
                </div>
                <div className="new-point-wizard__checks">
                  <label>
                    <input
                      type="checkbox"
                      checked={wizardNeedsPodrozetnik}
                      onChange={(event) => setWizardNeedsPodrozetnik(event.target.checked)}
                    />
                    Нужен подрозетник
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={wizardNeedsChasing}
                      onChange={(event) => setWizardNeedsChasing(event.target.checked)}
                    />
                    Нужно штробление
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={wizardLineReady}
                      onChange={(event) => setWizardLineReady(event.target.checked)}
                    />
                    Линия и щит готовы
                  </label>
                </div>
                <button type="button" className="button button--quiet button--small" onClick={addPointScenario}>
                  <Plus size={17} />
                  Добавить состав точки
                </button>
              </div>
            ) : null}
          </div>

          <div className="estimate-service-list" aria-live="polite">
            <div className="estimate-service-list__title">
              <strong>{search.trim() ? "Найденные позиции" : activeCategory === "popular" ? "Популярные работы" : "Позиции категории"}</strong>
              <span>{visibleServices.length} поз.</span>
            </div>
            {visibleServiceSlice.map((service) => (
              <ServiceOption
                key={service.id}
                service={service}
                quantityValue={quantityInputs[service.id] ?? getDefaultQuantity(service)}
                onQuantityChange={setServiceQuantityInput}
                onAdd={addService}
              />
            ))}
            {visibleCount < visibleServices.length ? (
              <button
                className="estimate-more-button"
                type="button"
                onClick={() => setVisibleCount((current) => current + 18)}
              >
                Показать ещё {Math.min(18, visibleServices.length - visibleCount)} поз.
              </button>
            ) : null}
          </div>
        </div>

        <aside className="estimate-summary" aria-label="Предварительная смета">
          <div className="estimate-summary__head">
            <span>Смета</span>
            <strong>{result.displayTotal}</strong>
            {result.totalMin ? <small>Работы: {formatMoney(result.totalMin)}</small> : <small>Добавьте работы из списка</small>}
          </div>

          {error ? (
            <div className="estimate-alert estimate-alert--danger" role="alert">
              <AlertTriangle size={17} />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="estimate-lines">
            {result.lines.length === 0 ? (
              <div className="estimate-empty">
                <Calculator size={27} />
                <p>Начните с поиска услуги или добавьте сценарий новой электроточки.</p>
              </div>
            ) : (
              result.lines.map((line) => {
                const service = getServiceByLegacyNumber(line.legacyNumber);

                return (
                  <article className="estimate-line" key={line.serviceId}>
                    <div>
                      <span>№{line.legacyNumber}</span>
                      <strong>{line.name}</strong>
                      <small>
                        {line.unitPriceDisplay} · {line.displayTotal}
                      </small>
                    </div>
                    <label>
                      <span className="visually-hidden">Количество: {line.name}</span>
                      <input
                        type="number"
                        min={service?.quantity.min ?? 0}
                        max={service?.quantity.max}
                        step={service?.quantity.step ?? 1}
                        value={formatQuantity(line.quantity).replace(",", ".")}
                        onChange={(event) => updateEstimateLine(line.serviceId, event.target.value)}
                      />
                      <em>{unitLabels[line.unit]}</em>
                    </label>
                    <button type="button" onClick={() => updateEstimateLine(line.serviceId, "0")} aria-label={`Удалить: ${line.name}`}>
                      <Trash2 size={16} />
                    </button>
                    {line.excludes[0] ? <p>{line.excludes[0]}</p> : null}
                  </article>
                );
              })
            )}
          </div>

          {result.warnings.length ? (
            <div className="estimate-warnings">
              {result.warnings.slice(0, 5).map((warning) => (
                <div className={`estimate-alert estimate-alert--${warning.level}`} key={`${warning.code}-${warning.message}`}>
                  {warning.level === "info" ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
                  <span>{warning.message}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div className="estimate-summary__actions">
            <button type="button" className="button button--primary" onClick={discussEstimate}>
              <MessageCircle size={18} />
              Обсудить смету в чате
            </button>
            <button type="button" className="button button--ghost" onClick={clearEstimate}>
              <RotateCcw size={18} />
              Очистить
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default EstimateCalculator;

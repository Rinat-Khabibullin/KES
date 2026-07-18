export type PriceKind = "fixed" | "from" | "range" | "manual";

export type CalculationMode = "line-item" | "package" | "preliminary" | "manual";

export type EstimateUnit =
  | "piece"
  | "meter"
  | "square-meter"
  | "service"
  | "visit"
  | "group"
  | "bag"
  | "device"
  | "module";

export type EstimateWarningLevel = "info" | "warning" | "danger";

export type EstimateWallMaterial =
  | "brick-gas-concrete"
  | "monolithic-concrete"
  | "reinforced-concrete";

export interface ServicePrice {
  kind: PriceKind;
  value?: number;
  min?: number;
  max?: number;
  currency: "RUB";
}

export interface ServiceQuantityConfig {
  min: number;
  max?: number;
  step: number;
  integerOnly: boolean;
}

export interface ServiceRelation {
  requires?: string[];
  suggests?: string[];
  conflictsWith?: string[];
  exclusiveGroup?: string;
}

export interface EstimateCategory {
  id: string;
  title: string;
}

export interface EstimateService {
  id: string;
  legacyNumber: number;
  categoryId: string;
  sourceName: string;
  name: string;
  shortName?: string;
  unit: EstimateUnit;
  originalUnit: string;
  price: ServicePrice;
  calculationMode: CalculationMode;
  quantity: ServiceQuantityConfig;
  aliases: string[];
  tags: string[];
  includes: string[];
  excludes: string[];
  relation?: ServiceRelation;
  publicVisible: boolean;
  needsOwnerReview: boolean;
  reviewReason?: string;
}

export interface EstimateLineInput {
  serviceId: string;
  quantity: number;
}

export interface EstimateConditions {
  wallMaterial?: EstimateWallMaterial;
  applyMonolithChasing?: boolean;
  drillingInReinforcedConcrete?: boolean;
}

export interface EstimateCalculateRequest {
  items: EstimateLineInput[];
  conditions?: EstimateConditions;
}

export interface EstimateWarning {
  code: string;
  level: EstimateWarningLevel;
  message: string;
  serviceIds?: string[];
}

export interface EstimateResultLine {
  serviceId: string;
  legacyNumber: number;
  categoryId: string;
  name: string;
  unit: EstimateUnit;
  originalUnit: string;
  quantity: number;
  unitPriceDisplay: string;
  priceKind: PriceKind;
  calculationMode: CalculationMode;
  lineTotalMin?: number;
  lineTotalMax?: number;
  displayTotal: string;
  manual: boolean;
  warnings: EstimateWarning[];
  includes: string[];
  excludes: string[];
}

export interface EstimateResult {
  lines: EstimateResultLine[];
  calculableSubtotal: number;
  totalMin?: number;
  totalMax?: number;
  displayTotal: string;
  hasFromPrices: boolean;
  manualItems: EstimateResultLine[];
  warnings: EstimateWarning[];
  catalogVersion: string;
}

export interface PriceSearchResult {
  service: EstimateService;
  score: number;
  matchedBy: string[];
}

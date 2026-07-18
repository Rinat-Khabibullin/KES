import type { EstimateCalculateRequest, EstimateLineInput } from "./types";

export const estimateDraftStorageKey = "elektrika-tuapse-estimate-draft-v1";

export type EstimateDraft = EstimateCalculateRequest;

export const serializeEstimateDraft = (draft: EstimateDraft) => JSON.stringify(draft);

export const parseEstimateDraft = (raw: string | null): EstimateDraft | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<EstimateDraft>;
    if (!parsed || !Array.isArray(parsed.items)) {
      return null;
    }

    const items: EstimateLineInput[] = parsed.items
      .filter(
        (item): item is EstimateLineInput =>
          Boolean(item) &&
          typeof item.serviceId === "string" &&
          typeof item.quantity === "number" &&
          Number.isFinite(item.quantity) &&
          item.quantity >= 0,
      )
      .slice(0, 80);

    return {
      items,
      conditions: {
        wallMaterial: parsed.conditions?.wallMaterial,
        applyMonolithChasing: Boolean(parsed.conditions?.applyMonolithChasing),
        drillingInReinforcedConcrete: Boolean(parsed.conditions?.drillingInReinforcedConcrete),
      },
    };
  } catch {
    return null;
  }
};

import { formatQuantity, unitLabels } from "./format";
import type { EstimateResult } from "./types";

export const summarizeEstimateForChat = (result: EstimateResult) => {
  if (result.lines.length === 0) {
    return "Я хочу рассчитать предварительную смету по электрике. Помогите уточнить состав работ.";
  }

  return `Я рассчитал предварительную смету: ${result.displayTotal.replace("Предварительная стоимость: ", "").replace("Рассчитано: ", "")}. Помогите проверить состав работ.`;
};

export const estimateResultToText = (result: EstimateResult) => {
  const lines = result.lines
    .map(
      (line) =>
        `№${line.legacyNumber} ${line.name}: ${formatQuantity(line.quantity)} ${unitLabels[line.unit]} × ${line.unitPriceDisplay} = ${line.displayTotal}`,
    )
    .join("\n");

  const warnings = result.warnings.length
    ? `\nПредупреждения:\n${result.warnings.map((warning) => `- ${warning.message}`).join("\n")}`
    : "";

  return `${result.displayTotal}\n${lines}${warnings}`.trim();
};

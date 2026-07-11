import { modelFacts } from "@/lib/constants";

function divide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export function getEvaluationMetrics() {
  const fakeRow = modelFacts.confusionMatrix[0];
  const realRow = modelFacts.confusionMatrix[1];
  const tp = fakeRow.predictedFake;
  const fn = fakeRow.predictedReal;
  const fp = realRow.predictedFake;
  const tn = realRow.predictedReal;
  const total = tp + tn + fp + fn;
  const precision = divide(tp, tp + fp);
  const recall = divide(tp, tp + fn);
  const specificity = divide(tn, tn + fp);

  return {
    positiveClass: "Fake",
    tp,
    tn,
    fp,
    fn,
    total,
    accuracy: divide(tp + tn, total),
    precision,
    recall,
    specificity,
    f1: divide(2 * precision * recall, precision + recall),
    falsePositiveRate: divide(fp, fp + tn),
    falseNegativeRate: divide(fn, fn + tp),
  };
}

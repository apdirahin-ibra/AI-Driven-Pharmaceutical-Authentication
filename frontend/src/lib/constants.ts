const confusionMatrix = [
  { actual: "Actual Fake", predictedFake: 152, predictedReal: 10 },
  { actual: "Actual Real", predictedFake: 19, predictedReal: 268 },
] as const;

const datasetSplits = {
  training: 661,
  validation: 453,
  testing: 449,
} as const;

const tp = confusionMatrix[0].predictedFake;
const fn = confusionMatrix[0].predictedReal;
const fp = confusionMatrix[1].predictedFake;
const tn = confusionMatrix[1].predictedReal;
const evaluatedImages = tp + fn + fp + tn;

export const modelFacts = {
  selectedModel: "CNN",
  modelFile: "cnn_best_model.keras",
  modelVersion: null,
  evaluatedAt: null,
  datasetVersion: null,
  testAccuracy: (tp + tn) / evaluatedImages,
  testLoss: 0.1784,
  fakeRecall: tp / (tp + fn),
  suspiciousThreshold: 0.75,
  inputSize: "224 x 224 x 3",
  outputClasses: "Fake / Real",
  dataset: {
    ...datasetSplits,
    total: datasetSplits.training + datasetSplits.validation + datasetSplits.testing,
  },
  confusionMatrix,
} as const;

export const semanticColors = {
  Real: "var(--real)",
  Fake: "var(--fake)",
  Suspicious: "var(--suspicious)",
} as const;

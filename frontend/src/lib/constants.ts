export const modelFacts = {
  selectedModel: "Improved CNN",
  modelFile: "cnn_best_model.keras",
  testAccuracy: 0.9354,
  testLoss: 0.1784,
  fakeRecall: 0.94,
  suspiciousThreshold: 0.75,
  inputSize: "224 x 224 x 3",
  outputClasses: "Fake / Real",
  dataset: {
    total: 1563,
    training: 661,
    validation: 453,
    testing: 449,
  },
  fakeMetrics: {
    precision: 0.89,
    recall: 0.94,
    f1: 0.91,
  },
  realMetrics: {
    precision: 0.96,
    recall: 0.93,
    f1: 0.95,
  },
  confusionMatrix: [
    { actual: "Actual Fake", predictedFake: 152, predictedReal: 10 },
    { actual: "Actual Real", predictedFake: 19, predictedReal: 268 },
  ],
} as const;

export const semanticColors = {
  Real: "var(--real)",
  Fake: "var(--fake)",
  Suspicious: "var(--suspicious)",
} as const;

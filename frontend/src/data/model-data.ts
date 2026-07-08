import type { ModelPerformance } from "@/types/domain";
import { modelFacts } from "@/lib/constants";

export const modelPerformances: ModelPerformance[] = [
  {
    name: "Improved CNN",
    category: "Custom Deep CNN",
    accuracy: 93.54,
    purpose: "Medicine image classification",
    status: "Selected Model",
    testLoss: modelFacts.testLoss,
    fakeRecall: 94,
  },
  {
    name: "ResNet50",
    category: "Transfer Learning",
    accuracy: 87.08,
    purpose: "Deep visual classification",
    status: "Evaluated",
  },
  {
    name: "MobileNetV2",
    category: "Lightweight Transfer Learning",
    accuracy: 81.51,
    purpose: "Lightweight image classification",
    status: "Evaluated",
  },
  {
    name: "EfficientNetB0",
    category: "Efficient Transfer Learning",
    accuracy: 80.4,
    purpose: "Efficient visual classification",
    status: "Evaluated",
  },
  {
    name: "DenseNet121",
    category: "Dense Transfer Learning",
    accuracy: 75.5,
    purpose: "Dense feature reuse comparison",
    status: "Evaluated",
  },
  {
    name: "VGG16",
    category: "Transfer Learning",
    accuracy: 71.05,
    purpose: "Transfer learning comparison",
    status: "Evaluated",
  },
];

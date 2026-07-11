import type { ModelPerformance } from "@/types/domain";
import { modelFacts } from "@/lib/constants";

export const modelPerformances: ModelPerformance[] = [
  {
    name: "CNN",
    category: "CNN Architecture",
    accuracy: modelFacts.testAccuracy * 100,
    purpose: "Medicine image classification",
    status: "Selected Model",
    testLoss: modelFacts.testLoss,
    fakeRecall: modelFacts.fakeRecall * 100,
  },
  {
    name: "ResNet50",
    category: "Transfer Learning",
    accuracy: 87.08,
    fakeRecall: 75.93,
    testLoss: 0.3661,
    purpose: "Deep visual classification",
    status: "Evaluated",
  },
  {
    name: "MobileNetV2",
    category: "Lightweight Transfer Learning",
    accuracy: 81.51,
    fakeRecall: 60.49,
    testLoss: 0.4440,
    purpose: "Lightweight image classification",
    status: "Evaluated",
  },
  {
    name: "EfficientNetB0",
    category: "Efficient Transfer Learning",
    accuracy: 80.4,
    fakeRecall: 46.30,
    testLoss: 0.4568,
    purpose: "Efficient visual classification",
    status: "Evaluated",
  },
  {
    name: "DenseNet121",
    category: "Dense Transfer Learning",
    accuracy: 75.5,
    fakeRecall: 36.42,
    testLoss: 0.4813,
    purpose: "Dense feature reuse comparison",
    status: "Evaluated",
  },
  {
    name: "VGG16",
    category: "Transfer Learning",
    accuracy: 71.05,
    fakeRecall: 38.89,
    testLoss: 0.9819,
    purpose: "Transfer learning comparison",
    status: "Evaluated",
  },
];

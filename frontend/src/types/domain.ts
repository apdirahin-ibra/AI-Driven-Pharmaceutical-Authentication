export type PredictionStatus = "Real" | "Fake" | "Suspicious";
export type UserRole = "Pharmacist" | "Admin";
export type RiskStatus = "Open" | "Under Review" | "Resolved";

export interface PredictionResponse {
  prediction: PredictionStatus;
  model_prediction: "Real" | "Fake";
  confidence: number;
  scores: {
    Fake: number;
    Real: number;
  };
  validation?: {
    status: string;
    code: string;
    supported_domain: string;
    message?: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
}

export interface ModelPerformance {
  name: string;
  category: string;
  accuracy: number;
  purpose: string;
  status: "Selected Model" | "Evaluated";
  testLoss?: number;
  fakeRecall?: number;
}

export interface ScanRecord {
  id: string;
  medicine: string;
  imageLabel: string;
  imageDataUrl?: string;
  result: PredictionStatus;
  modelPrediction: "Real" | "Fake";
  confidence: number;
  fakeScore: number;
  realScore: number;
  model: string;
  pharmacist: string;
  dateTime: string;
  reviewStatus: string;
}

export interface RiskReport {
  id: string;
  scanId: string;
  medicine: string;
  imageLabel: string;
  imageDataUrl?: string;
  aiResult: Exclude<PredictionStatus, "Real">;
  modelPrediction: "Real" | "Fake";
  confidence: number;
  fakeScore: number;
  realScore: number;
  pharmacist: string;
  scanDate: string;
  status: RiskStatus;
  notes: string;
}
